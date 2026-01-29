import { useEffect, useRef, useState } from "react";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL; 
// example: ws://localhost:8000

const useCourseNotifySocket = (courseId) => {
  const socketRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const wsUrl = `${WS_BASE}/ws/notify/course/${courseId}/`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("📢 Course notify socket connected");
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📢 Course notification:", data);

      /**
       * Expected payload from backend:
       * {
       *   event: "session_reminder",
       *   session_id,
       *   course_id,
       *   title,
       *   starts_at,
       *   join_url
       * }
       */
      setNotification(data);
    };

    socket.onerror = (err) => {
      console.error("❌ Course notify socket error", err);
    };

    socket.onclose = () => {
      console.log("📢 Course notify socket closed");
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [courseId]);

  return {
    connected,
    notification,
  };
};

export default useCourseNotifySocket;
