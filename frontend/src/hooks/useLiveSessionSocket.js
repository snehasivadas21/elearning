import { useEffect, useRef, useState } from "react";

const useLiveSessionSocket = (sessionId) => {
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [signal, setSignal] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    const protocol =
      window.location.protocol === "https:" ? "wss" : "ws";

    const wsUrl = `${protocol}://${window.location.host}/ws/live/${sessionId}/`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    /* ---------- OPEN ---------- */
    socket.onopen = () => {
      console.log("Live WS connected");
      setConnected(true);

      socket.send(
        JSON.stringify({
          type: "join",
        })
      );
    };

    /* ---------- MESSAGE ---------- */
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);

      /* PARTICIPANT EVENTS */
      if (data.type === "participants") {
        setParticipants(data.participants);
        return;
      }

      if (data.type === "participant") {
        if (data.event === "joined") {
          setParticipants((prev) => {
            if (prev.find((p) => p.user_id === data.user_id)) return prev;
            return [...prev, data.participant];
          });
          return;
        }

        if (data.event === "left") {
          setParticipants((prev) =>
            prev.filter((p) => p.user_id !== data.user_id)
          );
          return;
        }
      }

      /* MUTE / CAMERA */
      if (data.type === "mute") {
        setParticipants((prev) =>
          prev.map((p) =>
            p.user_id === data.user_id
              ? { ...p, is_muted: data.is_muted }
              : p
          )
        );
        return;
      }

      if (data.type === "camera") {
        setParticipants((prev) =>
          prev.map((p) =>
            p.user_id === data.user_id
              ? { ...p, camera_on: data.camera_on }
              : p
          )
        );
        return;
      }

      /* HAND RAISE */
      if (data.type === "hand") {
        setParticipants((prev) =>
          prev.map((p) =>
            p.user_id === data.user_id
              ? { ...p, hand_raised: data.hand_raised }
              : p
          )
        );
        return;
      }

      /* REACTION */
      if (data.type === "reaction") {
        setSignal(data); // handled by UI overlay
        return;
      }

      /* WEBRTC SIGNALS */
      if (data.type === "offer" || data.type === "answer" || data.type === "candidate") {
        setSignal(data);
        return;
      }
    };

    /* ---------- CLOSE ---------- */
    socket.onclose = () => {
      console.log("Live WS disconnected");
      setConnected(false);
    };

    socket.onerror = (err) => {
      console.error("Live WS error", err);
    };

    /* ---------- CLEANUP ---------- */
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "leave" }));
      }
      socket.close();
    };
  }, [sessionId]);

  /* ---------- SEND ---------- */
  const sendSignal = (payload) => {
    if (!socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(JSON.stringify(payload));
  };

  return {
    socket: socketRef.current,
    connected,
    participants,
    signal,
    sendSignal,
  };
};

export default useLiveSessionSocket;
