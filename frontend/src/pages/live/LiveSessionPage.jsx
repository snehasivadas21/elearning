import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import useLiveSessionSocket from "../../hooks/useLiveSessionSocket";
import useLocalMedia from "../../hooks/useLocalMedia"
import useWebRTC from "../../hooks/useWebRTC";
import LiveControlsBar from "../../components/live/LiveControlsBar";
import ParticipantsPanel from "../../components/live/ParticipantsPanel";
import ReactionOverlay from "../../components/live/ReactionOverlay";

const LiveSessionPage = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reactions,setReactions] = useState([]);
  const [showParticipants, setShowParticipants] = useState(true);

  const {
    socket,
    connected,
    participants,
    userRole,
  } = useLiveSessionSocket(sessionId);

  const {
    videoRef: localVideoRef,
    stream: localStream,
    micOn,
    cameraOn,
    toggleMic,
    toggleCamera,
  } = useLocalMedia();

  const { remoteVideoRef, startCall } = useWebRTC({
    socket,
    localStream,
    isInstructor: userRole === "tutor",
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axiosInstance.get(`/live/${sessionId}/`);
        setSession(res.data);

        if (
          res.data.status !== "ongoing" &&
          userRole === "student"
        ) {
          navigate(`/live/${sessionId}/wait`);
        }
      } catch (err) {
        console.error("Failed to load session", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, navigate, userRole]);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.send(JSON.stringify({ type: "join" }));

    return () => {
      socket.send(JSON.stringify({ type: "leave" }));
      socket.close();
    };
  }, [socket, connected]);

  useEffect(() => {
    if (connected && userRole === "tutor") {
      startCall();
    }
  }, [connected, userRole]);

  const raiseHand = () => {
    socket?.send(JSON.stringify({ type: "toggle-hand",raised: true ,}));
  };

  const sendReaction = (emoji) => {
    socket?.send(
      JSON.stringify({ type: "reaction", emoji })
    );
  };

  const leaveSession = async () => {
    if (userRole === "tutor") {
      await axiosInstance.post(`/live/${sessionId}/end/`);
    }
    socket?.send(JSON.stringify({ type: "leave" }));
    socket?.close();
    navigate("/");
  };

  if (loading) return <p className="p-4">Loading live session...</p>;
  if (!session) return <p className="p-4">Session not found</p>;

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full max-w-5xl rounded-lg bg-black"
          />

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute bottom-4 right-4 w-48 rounded-md"
          />

          <ReactionOverlay reactions={reactions} />
        </div>

        <LiveControlsBar
          micOn={micOn}
          cameraOn={cameraOn}
          handRaised={false}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onRaiseHand={raiseHand}
          onReaction={sendReaction}
          onLeave={leaveSession}
        />
      </div>

      {showParticipants && (
        <ParticipantsPanel participants={participants} />
      )}
    </div>
  );
};

export default LiveSessionPage;
