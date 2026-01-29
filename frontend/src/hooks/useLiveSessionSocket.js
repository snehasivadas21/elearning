import { useEffect, useRef, useState } from "react";

const useLiveSessionSocket = (sessionId) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [signal, setSignal] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws/live/${sessionId}/`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Live WS connected");
      setConnected(true);

      socket.send(
        JSON.stringify({
          type: "join",
        })
      );
    };

    socket.onclose = () => {
      console.log("Live WS disconnected");
      setConnected(false);
    };

    socket.onerror = (err) => {
      console.error("Live WS error", err);
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "participants") {
        setParticipants(data.participants);
      } else {
        setSignal(data);
      }
    };

    return () => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify({ type: "leave" }));
      }
      socket.close();
    };
  }, [sessionId]);

  const sendSignal = (payload) => {
    if (!socketRef.current || socketRef.current.readyState !== 1) return;

    socketRef.current.send(JSON.stringify(payload));
  };

  return {
    connected,
    signal,
    sendSignal,
    participants,
  };
};

export default useLiveSessionSocket;
