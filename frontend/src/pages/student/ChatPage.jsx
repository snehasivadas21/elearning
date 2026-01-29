import { useEffect, useState } from "react";
import ChatSidebar from "../../components/chat/ChatSidebar";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import useWebSocket from "../../hooks/useLiveSessionSocket";
import axiosInstance from "../../api/axiosInstance";

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);

  const { sendMessage } = useWebSocket({
    roomId:selectedRoom?.id,
    onMessage:(message) => {
      setMessages((prev) => [...prev, message]);
    }
  });

  useEffect(() => {
    if (!selectedRoom) return;

    axiosInstance
      .get(`/chat/rooms/${selectedRoom.id}/messages/`)
      .then((res) => setMessages(res.data.results))
      .catch(() => setMessages([]));
  }, [selectedRoom]);

  return (
    <div className="flex h-screen">
      <ChatSidebar
        onSelectRoom={setSelectedRoom}
        onRoomLoaded={setSelectedRoom}
        activeRoomId={selectedRoom?.id}
      />

      <div className="flex flex-col flex-1">
          <>
            <MessageList messages={messages} />
            <MessageInput disabled={!selectedRoom} onSend={sendMessage} />
          </>
      </div>
    </div>
  );
}
