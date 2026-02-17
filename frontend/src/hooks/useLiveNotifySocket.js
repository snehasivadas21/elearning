import { useEffect, useRef, useState } from "react";

const useLiveNotifySocket = (courseIds = []) => {
  const socketsRef = useRef({});
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!courseIds.length) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    courseIds.forEach((courseId) => {
      if (socketsRef.current[courseId]) return;

      const wsUrl = `${protocol}://${window.location.host}/ws/notify/course/${courseId}/`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => setConnected(true);

      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.event === "live_created" || data.event === "live_started") {
          setNotifications((prev) => {
            // if already exists, update it (e.g. created → started)
            const exists = prev.some((n) => n.session_id === data.session_id);
            if (exists) {
              return prev.map((n) =>
                n.session_id === data.session_id ? { ...n, ...data } : n
              );
            }
            return [data, ...prev];
          });
        }

        if (data.event === "live_cancelled") {
          // replace with cancelled entry briefly, then auto-remove after 5s
          setNotifications((prev) => {
            const filtered = prev.filter((n) => n.session_id !== data.session_id);
            return [{ ...data }, ...filtered];
          });
          setTimeout(() => {
            setNotifications((prev) =>
              prev.filter((n) => n.session_id !== data.session_id)
            );
          }, 5000);
        }
      };

      socket.onclose = () => {
        delete socketsRef.current[courseId];
        setConnected(false);
      };

      socket.onerror = (err) => {
        console.error(`Notify socket error (${courseId})`, err);
      };

      socketsRef.current[courseId] = socket;
    });

    return () => {
      Object.values(socketsRef.current).forEach((s) => s.close());
      socketsRef.current = {};
      setConnected(false);
    };
  }, [courseIds]);

  const dismiss = (sessionId) => {
    setNotifications((prev) => prev.filter((n) => n.session_id !== sessionId));
  };

  const dismissAll = () => setNotifications([]);

  return { connected, notifications, dismiss, dismissAll };
};

export default useLiveNotifySocket;