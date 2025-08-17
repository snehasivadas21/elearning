import { useEffect, useRef, useState } from "react";

export default function useWebSocket(roomId) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);

  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!roomId || !token) return;

    const wsUrl = `ws://localhost:8000/ws/chat/${roomId}/?token=${token}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "chat.message":
          setMessages((prev) => [...prev, data]);
          break;

        case "chat.online":
          setOnlineUsers(data.users || []);
          break;

        case "chat.typing":
          if (data.username) {
            setTypingUsers((prev) => {
              if (!prev.includes(data.username)) return [...prev, data.username];
              return prev;
            });

            setTimeout(() => {
              setTypingUsers((prev) =>
                prev.filter((u) => u !== data.username)
              );
            }, 2000);
          }
          break;

        default:
          console.warn("⚠️ Unknown WebSocket event:", data);
      }
    };

    socketRef.current.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    socketRef.current.onclose = () => {
      console.log("🔌 WebSocket disconnected");
    };

    return () => {
      socketRef.current?.close();
    };
  }, [roomId, token]);

  const sendMessage = (message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected yet");
    }
  };

  return { messages, sendMessage, onlineUsers, typingUsers };
}
