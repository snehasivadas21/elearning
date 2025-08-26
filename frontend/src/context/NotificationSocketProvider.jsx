// src/context/NotificationSocketProvider.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const NotifCtx = createContext(null);
export const useNotifications = () => useContext(NotifCtx);

export default function NotificationSocketProvider({ userId, children }) {
  const [unread, setUnread] = useState([]);
  const [recent, setRecent] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const wsUrl = (location.protocol === "https:" ? "wss://" : "ws://")
      + location.host + "/ws/notifications/";

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "init") {
        setUnread(data.unread);
        setRecent(data.recent);
      } else if (data.type === "notification") {
        setRecent(prev => [data, ...prev]);
        setUnread(prev => [data, ...prev]);
      } else if (data.type === "marked") {
        setUnread(prev => prev.filter(n => n.id !== data.id));
        setRecent(prev => prev.map(n => (n.id === data.id ? { ...n, is_read: true } : n)));
      } else if (data.type === "marked_all") {
        setUnread([]);
        setRecent(prev => prev.map(n => ({ ...n, is_read: true })));
      } else if (data.type === "history") {
        setRecent(prev => [...prev, ...data.items]);
      }
    };

    ws.onclose = () => {
      // simple retry
      setTimeout(() => {
        if (socketRef.current === ws) socketRef.current = null;
      }, 2000);
    };

    return () => ws.close();
  }, [userId]);

  const markRead = (id) => socketRef.current?.send(JSON.stringify({ action: "mark_read", id }));
  const markAll = () => socketRef.current?.send(JSON.stringify({ action: "mark_all_read" }));
  const fetchMore = (page) => socketRef.current?.send(JSON.stringify({ action: "fetch", page }));

  return (
    <NotifCtx.Provider value={{ unread, recent, markRead, markAll, fetchMore }}>
      {children}
    </NotifCtx.Provider>
  );
}
