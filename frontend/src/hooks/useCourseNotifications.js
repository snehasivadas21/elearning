import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useCourseNotifications(userId, token) {
  const [banner, setBanner] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !token) return;

    const ws = new WebSocket(
      `${import.meta.env.VITE_WS_BASE_URL}/ws/notifications/${userId}/?token=${token}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "session_started") {
        setBanner({
          message: `Live session for ${data.course_title} has started`,
          joinUrl: `/live-session/${data.course_id}/${data.session_id}`,
        });
      }
    };

    return () => ws.close();
  }, [userId, token]);

  return { banner, clearBanner: () => setBanner(null), navigate };
}
