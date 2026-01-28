import { useEffect, useRef } from "react";

export default function useChatSocket({ roomId, onMessage }) {
  const socketRef = useRef(null);
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!roomId || !token) return;

    const wsUrl = `ws://localhost:8000/ws/chat/${roomId}/?token=${token}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("Chat socket connected");
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat.message") {
        onMessage?.(data);
      }
    };

    socketRef.current.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    socketRef.current.onclose = () => {
      console.log("Chat socket closed");
    };

    return () => {
      socketRef.current?.close();
    };
  }, [roomId, token, onMessage]);

  const sendMessage = (payload) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  return { sendMessage };
}
