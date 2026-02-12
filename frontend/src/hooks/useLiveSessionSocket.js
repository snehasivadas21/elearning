import { useCallback, useEffect, useRef, useState } from "react";

const useLiveSessionSocket = (sessionId) => {
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [sessionEnded, setSessionEnded] = useState(false); 

  useEffect(() => {
    if (!sessionId) return;

    const protocol =
      window.location.protocol === "https:" ? "wss" : "ws";

    const wsUrl = `${protocol}://localhost:8000/ws/live/${sessionId}/`;

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

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "joined" && data.role) {
        setUserRole(data.role);
        return;
      }

      if (data.type === "participants") {
        setParticipants(data.participants);
        return;
      }

      if (data.type === "participant") {
        if (data.event === "joined") {
          setParticipants((prev) => {
          
            if (!data.participant) return prev;
            if (prev.find((p) => p.user_id === data.participant.user_id)) return prev;
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

      if (data.type === "reaction") {
        setReactions((prev) => [...prev, data]);
        return;
      }

      if (data.type === "session_ended") {
        setSessionEnded(true);
        return;
      }
    };

    socket.onclose = () => {
      console.log("Live WS disconnected");
      setConnected(false);
    };

    socket.onerror = (err) => {
      console.error("Live WS error", err);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "leave" }));
      }
      socket.close();
    };
  }, [sessionId]);

  const sendSignal = useCallback((payload) => {
    if (!socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify(payload));
  }, []);

  const sendRaw = useCallback((jsonString) => {
    if (!socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(jsonString);
  }, []);

  const addMessageListener = useCallback((handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.addEventListener("message", handler);
    return () => {
      socketRef.current?.removeEventListener("message", handler);
    };
  }, []);

  return {
    connected,
    participants,
    userRole,
    reactions,
    sessionEnded,       
    sendSignal,
    sendRaw,
    addMessageListener,
  };
};

export default useLiveSessionSocket;