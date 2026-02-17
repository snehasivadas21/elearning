import { useEffect, useRef, useState } from "react";

const useChatNotifySocket = (userId) => {
  const socketRef = useRef(null);
  const [unreadChats, setUnreadChats] = useState({});

  useEffect(() => {
    if (!userId) {
      console.log("No userId for socket");
      return;
    }

    console.log("Connecting notification socket for user:", userId);
    const token = localStorage.getItem("access");
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    const wsUrl = `${protocol}://${window.location.host}/ws/chat/user/${userId}/?token=${token}`;

    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log("Notification socket connected");
    };

    socket.onmessage = (e) => {
      console.log("Notification received:", e.data);

      const data = JSON.parse(e.data);

      if (data.event === "new_message") {
        setUnreadChats((prev) => ({
          ...prev,
          [data.room_id]: (prev[data.room_id] || 0) + 1,
        }));
      }
    };

    socket.onerror = (err) => {
      console.log("Notification socket error:", err);
    };

    socket.onclose = () => {
      console.log("Notification socket closed");
    };

    socketRef.current = socket;

    return () => socket.close();
  }, [userId]);

  const markChatRead = (roomId) => {
    setUnreadChats((prev) => {
      const copy = { ...prev };
      delete copy[roomId];
      return copy;
    });
  };

  return {
    unreadChats,
    unreadCount: Object.keys(unreadChats).length,
    markChatRead,
  };
};

export default useChatNotifySocket;
