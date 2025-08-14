import { useEffect, useRef, useState } from "react";
import jwtDecode from "jwt-decode";

export function useWebSocket({ url, token }) {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Add token in query params for backend auth middleware
    const wsUrl = `${url}?token=${token}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    socketRef.current.onclose = () => {
      console.log("❌ WebSocket disconnected");
    };

    return () => {
      socketRef.current.close();
    };
  }, [url, token]);

  const sendMessage = (message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  return { messages, sendMessage };
}
