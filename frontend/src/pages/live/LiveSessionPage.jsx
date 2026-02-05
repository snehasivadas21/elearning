import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import useLiveSessionSocket from "../../hooks/useLiveSessionSocket";
import useLocalMedia from "../../hooks/useLocalMedia";
import useWebRTC from "../../hooks/useWebRTC";
import LiveControlsBar from "../../components/live/LiveControlsBar";
import ParticipantsPanel from "../../components/live/ParticipantsPanel";
import ReactionOverlay from "../../components/live/ReactionOverlay";

const LiveSessionPage = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [handRaised, setHandRaised] = useState(false);

  const {
    sendSignal,
    sendRaw,
    addMessageListener,
    connected,
    participants,
    userRole,
    reactions,
    sessionEnded,       // FIX 7: server pushes this when tutor ends
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
    sendRaw,
    addMessageListener,
    localStream,
    isInstructor: userRole === "tutor",
  });

  // Fetch session info once on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axiosInstance.get(`/live/${sessionId}/`);
        setSession(res.data);

        if (res.data.status !== "ongoing" && userRole === "student") {
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

  // Tutor starts the WebRTC call once everything is ready
  useEffect(() => {
    if (connected && userRole === "tutor" && localStream) {
      startCall();
    }
  }, [connected, userRole, localStream]);

  // FIX 7: if server pushes session_ended, navigate all students away
  useEffect(() => {
    if (sessionEnded) {
      navigate("/");
    }
  }, [sessionEnded, navigate]);

  const raiseHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    sendSignal({ type: "toggle-hand", raised: next });
  };

  const sendReaction = (emoji) => {
    sendSignal({ type: "reaction", emoji });
  };

  const leaveSession = async () => {
    if (userRole === "tutor") {
      await axiosInstance.post(`/live/${sessionId}/end/`);
      // end_session API now broadcasts session_ended to the webrtc room.
      // Students will get it via the useEffect above and navigate away.
      // Tutor navigates immediately after the API call returns.
    }
    sendSignal({ type: "leave" });
    navigate("/");
  };

  if (loading) return <p className="p-4">Loading live session...</p>;
  if (!session) return <p className="p-4">Session not found</p>;

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 relative">
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
            className="absolute bottom-4 right-4 w-48 rounded-md border border-gray-600 bg-black"
          />

          <ReactionOverlay reactions={reactions} />
        </div>

        <LiveControlsBar
          micOn={micOn}
          cameraOn={cameraOn}
          handRaised={handRaised}
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