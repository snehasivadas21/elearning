import { useEffect, useRef, useState } from "react";
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
    sessionEnded,   
    studentJoined,    
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
  
  const hasCalledRef = useRef(false);
 
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

 
  useEffect(() => {
    if (userRole === "tutor" && localStream && studentJoined) {
      console.log("Student joined — tutor sending offer");
      hasCalledRef.current = false; // reset so new offer goes out
      startCall();
    }
  }, [studentJoined]); // only fires when studentJoined toggles

  // ✅ Fallback: if tutor connects and student is already in the room
  useEffect(() => {
    if (
      connected &&
      userRole === "tutor" &&
      localStream &&
      participants.some((p) => p.role === "student") &&
      !hasCalledRef.current
    ) {
      console.log("Tutor connected, student already present — sending offer");
      hasCalledRef.current = true;
      startCall();
    }
  }, [connected, userRole, localStream, participants]);
  
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