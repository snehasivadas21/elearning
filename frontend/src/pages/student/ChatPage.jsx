import { useEffect, useState, useContext } from "react";
import ChatSidebar from "../../components/chat/ChatSidebar";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import useWebSocket from "../../hooks/useWebSocket";
import useChatNotifySocket from "../../hooks/useChatNotifySocket";
import axiosInstance from "../../api/axiosInstance";
import { AuthContext } from "../../context/AuthContext";

export default function ChatPage() {
  const { user } = useContext(AuthContext);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);

  const userId = user?.user_id;
  const { unreadChats, markChatRead } = useChatNotifySocket(userId);

  const { sendMessage } = useWebSocket(
    selectedRoom?.id,
    (data) => {
      if (!data?.message) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      });
    }
  );

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    // ✅ Clear unread count for this room when user opens it
    markChatRead(room.id);
  };

  useEffect(() => {
    if (!selectedRoom) return;

    axiosInstance
      .get(`/chat/rooms/${selectedRoom.id}/messages/`)
      .then((res) => setMessages(res.data.results))
      .catch(() => setMessages([]));
  }, [selectedRoom]);

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <ChatSidebar
        onSelectRoom={handleSelectRoom}
        onRoomLoaded={handleSelectRoom}
        activeRoomId={selectedRoom?.id}
        unreadChats={unreadChats}
      />

      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <MessageList
            messages={messages}
            currentUserId={user?.user_id}
          />
        </div>

        <div className="shrink-0 border-t bg-white sticky bottom-0">
          <MessageInput
            disabled={!selectedRoom}
            onSend={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}