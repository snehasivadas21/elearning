from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import LiveSession, LiveParticipant

class LiveSessionConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room_group = f"webrtc_{self.session_id}"

        if not self.user or not self.user.is_authenticated:
            return await self.close()

        if not await self.can_join(self.session_id, self.user.id):
            return await self.close()

        await self.mark_joined()

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "participant.event",
                "event": "joined",
                "user_id": self.user.id,
                "name": self.user.get_full_name() or self.user.email,
            }
        )

    async def disconnect(self, code):
        await self.mark_left()

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "participant.event",
                "event": "left",
                "user_id": self.user.id,
            }
        )

        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def participant_event(self, event):
        await self.send_json({
            "type": "participant",
            "event": event["event"],
            "user_id": event["user_id"],
            "name": event.get("name"),
        })

    async def participant_mute(self, event):
        await self.send_json({
            "type": "mute",
            "user_id": event["user_id"],
            "is_muted": event["is_muted"],
        })

    async def participant_hand(self, event):
        await self.send_json({
            "type": "hand",
            "user_id": event["user_id"],
            "hand_raised": event["hand_raised"],
        })

    async def reaction_event(self, event):
        await self.send_json({
            "type": "reaction",
            "user_id": event["user_id"],
            "emoji": event["emoji"],
    })

    async def receive_json(self, content, **kwargs):
        t = content.get("type")

        if t == "join":
            await self.handle_join()

        elif t == "leave":
            await self.handle_leave()

        elif t in ("offer", "answer", "ice-candidate"):
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "signal.forward",
                    "from": self.user.id,
                    "to": content.get("to"),
                    "signal_type": t,
                    "payload": {k: v for k, v in content.items() if k != "type"},
                }
            )
        elif t == "toggle-mute":
            muted = content.get("muted", False)
            await self.update_mute_state(muted)

            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "participant.mute",
                    "user_id": self.user.id,
                    "is_muted": muted,
                }
            ) 
        elif t == "toggle-hand":
            raised = content.get("raised", False)
            await self.update_hand_state(raised)

            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "participant.hand",
                    "user_id": self.user.id,
                    "hand_raised": raised,
                }
            )
        
        elif t == "reaction":
            emoji = content.get("emoji")

            if emoji:
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        "type": "reaction.event",
                        "user_id": self.user.id,
                        "emoji": emoji,
                    }
                )      

    async def signal_forward(self, event):
        await self.send_json(event)

    @database_sync_to_async
    def can_join(self):
        s = LiveSession.objects.get(id=self.session_id)
        if s.status != "ongoing":
            return False
        c = s.course
        return c.instructor_id == self.user.id or c.enrolled_students.filter(id=self.user.id).exists()

    @database_sync_to_async
    def mark_joined(self):
        LiveParticipant.objects.update_or_create(
            session_id=self.session_id,
            user_id=self.user.id,
            defaults={"joined_at": timezone.now(), "left_at": None}
        )

    @database_sync_to_async
    def upsert_participant(self):
        session = LiveSession.objects.get(id=self.session_id)
        LiveParticipant.objects.update_or_create(
            session=session,
            user=self.user,
            defaults={
                "joined_at": timezone.now(),
                "left_at": None,
            },
        )

    @database_sync_to_async
    def mark_left(self):
        LiveParticipant.objects.filter(
            session_id=self.session_id,
            user_id=self.user.id,
            left_at__isnull=True
        ).update(left_at=timezone.now())

    @database_sync_to_async
    def get_participants(self):
        return list(
            LiveParticipant.objects.filter(
                session_id=self.session_id,
                left_at__isnull=True,
            ).select_related("user")
            .values(
                "user__id",
                "user__username",
                "role",
                "hand_raised",
                "is_muted",
            )
        )
    
    @database_sync_to_async
    def update_mute_state(self, muted):
        LiveParticipant.objects.filter(
            session_id=self.session_id,
            user_id=self.user.id,
            left_at__isnull=True
        ).update(is_muted=muted)

    @database_sync_to_async
    def update_hand_state(self, raised):
        LiveParticipant.objects.filter(
            session_id=self.session_id,
            user_id=self.user.id,
            left_at__isnull=True
        ).update(hand_raised=raised)
        

    async def handle_join(self):
        await self.upsert_participant()
        participants = await self.get_participants()

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "participants.update",
                "participants": participants,
            },
        )

    async def handle_leave(self):
        await self.mark_left()
        participants = await self.get_participants()

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "participants.update",
                "participants": participants,
            },
        )
    
        
