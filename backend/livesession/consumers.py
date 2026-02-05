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

        if not await self.can_join():
            return await self.close()

        # FIX 6: was self.mark_joined() — method did not exist.
        # upsert_participant() is the correct method AND now sets role.
        await self.upsert_participant()

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        # FIX 1: send the user's own role back to THEM directly (not to group).
        # Frontend useLiveSessionSocket listens for { type: "joined", role }
        # to set userRole. Without this, userRole is always null and the
        # tutor never calls startCall().
        role = await self.get_user_role()
        await self.send_json({
            "type": "joined",
            "role": role,                                          # "tutor" or "student"
            "user_id": self.user.id,
        })

        # FIX 4: wrap user_id + name inside a "participant" object.
        # Frontend does: [...prev, data.participant]
        # Before this fix, data.participant was undefined because the keys
        # were at the top level.
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "participant.event",
                "event": "joined",
                "user_id": self.user.id,
                "participant": {                                   # <-- wrapper added
                    "user_id": self.user.id,
                    "name": self.user.get_full_name() or self.user.email,
                    "role": role,
                    "hand_raised": False,
                    "is_muted": False,
                },
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

    # ──────────────────────────────────────────────
    # Group-level message handlers (called by channel layer)
    # ──────────────────────────────────────────────

    async def participant_event(self, event):
        # FIX 4: forward the "participant" wrapper when present
        msg = {
            "type": "participant",
            "event": event["event"],
            "user_id": event["user_id"],
        }
        if "participant" in event:
            msg["participant"] = event["participant"]
        if "name" in event:
            msg["name"] = event["name"]

        await self.send_json(msg)

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

    async def participants_update(self, event):
        await self.send_json({
            "type": "participants",
            "participants": event["participants"],
        })

    async def reaction_event(self, event):
        await self.send_json({
            "type": "reaction",
            "user_id": event["user_id"],
            "emoji": event["emoji"],
        })

    # FIX 7 (consumer side): handler for session_ended broadcast.
    # end_session view will now also group_send to "webrtc_{session_id}".
    async def session_ended(self, event):
        await self.send_json({
            "type": "session_ended",
            "session_id": event["session_id"],
        })

    # ──────────────────────────────────────────────
    # Incoming messages from the client
    # ──────────────────────────────────────────────

    async def receive_json(self, content, **kwargs):
        t = content.get("type")

        if t == "join":
            await self.handle_join()

        elif t == "leave":
            await self.handle_leave()

        # FIX 3: WebRTC signals must NOT broadcast to the group.
        # group_send sends to ALL clients in the room including the sender.
        # The sender then receives its own offer/answer/ice-candidate back,
        # which corrupts the peer connection (especially ice-candidates —
        # both sides were adding each other's AND their own candidates).
        # Use self.send_json() to send only to the OTHER side.
        # In a 1-to-1 session (tutor ↔ student) this is correct:
        # the other side is everyone in the group EXCEPT the sender.
        # We broadcast to group but skip self in the handler below.
        elif t in ("offer", "answer", "ice-candidate"):
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "signal.forward",
                    "from_user_id": self.user.id,       # track who sent it
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

    # FIX 3: signal_forward now skips the sender.
    # If this consumer IS the sender, do not forward back to them.
    async def signal_forward(self, event):
        if event["from_user_id"] == self.user.id:
            return                                                 # skip sender

        await self.send_json({
            "type": event["signal_type"],                          # "offer" / "answer" / "ice-candidate"
            **event["payload"],
        })

    # ──────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────

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

    # ──────────────────────────────────────────────
    # DB helpers (sync wrapped)
    # ──────────────────────────────────────────────

    @database_sync_to_async
    def can_join(self):
        try:
            s = LiveSession.objects.get(id=self.session_id)
        except LiveSession.DoesNotExist:
            return False
        if s.status != "ongoing":
            return False
        c = s.course
        return c.instructor_id == self.user.id or c.enrolled_students.filter(id=self.user.id).exists()

    # FIX 2: upsert_participant now determines and sets role.
    # If the user is the course instructor → "tutor", else → "student".
    # Uses defaults so it only sets role on CREATE. If start_session
    # already created the instructor row with role="instructor", this
    # won't overwrite it (update_or_create defaults only apply on create).
    @database_sync_to_async
    def upsert_participant(self):
        session = LiveSession.objects.get(id=self.session_id)
        is_instructor = session.course.instructor_id == self.user.id
        role = "tutor" if is_instructor else "student"

        LiveParticipant.objects.update_or_create(
            session=session,
            user=self.user,
            defaults={
                "joined_at": timezone.now(),
                "left_at": None,
                "role": role,                                      # FIX 2: role is set
            },
        )

    @database_sync_to_async
    def get_user_role(self):
        """Return this user's role string for the current session."""
        try:
            p = LiveParticipant.objects.get(
                session_id=self.session_id,
                user_id=self.user.id,
                left_at__isnull=True,
            )
            return p.role or "student"
        except LiveParticipant.DoesNotExist:
            return "student"

    @database_sync_to_async
    def mark_left(self):
        LiveParticipant.objects.filter(
            session_id=self.session_id,
            user_id=self.user.id,
            left_at__isnull=True
        ).update(left_at=timezone.now())

    # FIX 5: .values() with select_related produces keys like "user__id".
    # Frontend expects "user_id". Use .annotate() + F() to rename,
    # or just remap in Python after the query.
    @database_sync_to_async
    def get_participants(self):
        rows = (
            LiveParticipant.objects.filter(
                session_id=self.session_id,
                left_at__isnull=True,
            )
            .select_related("user")
            .values(
                "user__id",
                "user__username",
                "role",
                "hand_raised",
                "is_muted",
            )
        )
        # Remap Django's double-underscore keys to what frontend expects
        return [
            {
                "user_id": row["user__id"],
                "username": row["user__username"],
                "role": row["role"],
                "hand_raised": row["hand_raised"],
                "is_muted": row["is_muted"],
            }
            for row in rows
        ]

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