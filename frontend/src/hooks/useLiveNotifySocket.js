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

        if (
          data.event === "live_created" ||
          data.event === "live_started"
        ) {
          setNotifications((prev) => {
            if (prev.some((n) => n.session_id === data.session_id)) {
              return prev;
            }
            return [data, ...prev];
          });
        }

        if (data.event === "live_cancelled") {
          setNotifications((prev) =>
            prev.filter((n) => n.session_id !== data.session_id)
          );
        }
      };

      socket.onclose = () => {
        delete socketsRef.current[courseId];
      };

      socket.onerror = (err) => {
        console.error(`Notify socket error (${courseId})`, err);
      };

      socketsRef.current[courseId] = socket;
    });

    return () => {
      Object.values(socketsRef.current).forEach((socket) => socket.close());
      socketsRef.current = {};
      setConnected(false);
    };
  }, [courseIds]);

  return {
    connected,
    notifications,
  };
};

export default useLiveNotifySocket;
