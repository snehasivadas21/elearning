import { useEffect, useRef, useState } from "react";

const useChatNotifySocket = (userId) => {
  const socketRef = useRef(null);
  const [unreadChats, setUnreadChats] = useState({});

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws/chat/user/${userId}/`;

    const socket = new WebSocket(wsUrl);

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.event === "new_message") {
        setUnreadChats((prev) => ({
          ...prev,
          [data.room_id]: (prev[data.room_id] || 0) + 1,
        }));
      }
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
