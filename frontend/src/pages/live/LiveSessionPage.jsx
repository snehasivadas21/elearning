import { useState,useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, Hand, Smile, Users, PhoneOff } from "lucide-react";
import { useParams } from "react-router-dom";
import useLiveSessionSocket from "../../hooks/useLiveSessionSocket";
import ParticipantsPanel from "../../components/live/ParticipantsPanel";
import useLocalMedia from "../../hooks/useLocalMedia";
import useWebRTC from "../../hooks/useWebRTC";
import axiosInstance from "../../api/axiosInstance";
import ReactionOverlay from "../../components/live/ReactionOverlay";

const LiveSessionPage = () => {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [showParticipants, setShowParticipants] = useState(true);
  const { sessionId } = useParams();
  const { connected, signal } = useLiveSessionSocket(sessionId);
  const { participants } = useLiveSessionSocket(sessionId);
  const socketRef = useRef(null);
  const isInstructor = user.role === "instructor";


  useEffect(() => {
    if (!signal) return;
    console.log("LIVE SIGNAL:", signal);
  }, [signal]);
  
  useEffect(() => {
    socketRef.current = new WebSocket(
        `${WS_BASE_URL}/ws/live/${sessionId}/`
    );

    return () => socketRef.current?.close();
  }, [sessionId]);

  const { remoteVideoRef, startCall } = useWebRTC({
    socket: socketRef.current,
    localStream: streamRef.current,
    isInstructor,
   });

  useEffect(() => {
    if (isInstructor && socketRef.current && streamRef.current) {
        startCall();
    }
    }, [isInstructor, startCall]);

  useEffect(() => {
    axiosInstance.get(`/live/${sessionId}/participants/`)
        .then(res => setShowParticipants(res.data));
    }, [sessionId]);

  const handleToggleMic = () => {
    toggleMic();

    socketRef.current?.send(
        JSON.stringify({
        type: "toggle-mute",
        muted: micOn, // micOn BEFORE toggle = new muted state
        })
    );
    };

    const handleRaiseHand = () => {
        const newState = !handRaised;
        setHandRaised(newState);

        socketRef.current?.send(
            JSON.stringify({
                type: "toggle-hand",
                raised: newState,
                })
        );
        };

    const handleReaction = (emoji) => {
        socketRef.current?.send(
            JSON.stringify({
                type: "reaction",
                emoji,
            })
        );
    };


  
//   const participants = [
//     { id: 1, name: "Instructor", role: "instructor" },
//     { id: 2, name: "Student A", role: "student" },
//     { id: 3, name: "Student B", role: "student" },
//   ];

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      
      {/* TOP BAR */}
      <div className="h-14 bg-gray-800 flex items-center justify-between px-6">
        <h2 className="font-semibold">Live Session</h2>
        <span className="text-sm bg-red-600 px-3 py-1 rounded-full">
          LIVE
        </span>
      </div>

      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* VIDEO GRID */}
        <div className="flex-1 grid grid-cols-2 gap-4 p-4">
          {participants.map((p) => (
            <div
              key={p.id}
              className="bg-black rounded-lg flex items-center justify-center relative"
            >
              <span className="absolute bottom-2 left-2 text-xs bg-gray-700 px-2 py-1 rounded">
                {p.name}
              </span>

              {/* video placeholder */}
              <div className="text-gray-500">
                {cameraOn ? "Video Stream" : "Camera Off"}
              </div>
            </div>
          ))}
        </div>

        {/* PARTICIPANTS PANEL */}
        {/* {showParticipants && (
          <div className="w-64 bg-gray-800 p-4 border-l border-gray-700">
            <h3 className="font-semibold mb-3">Participants</h3>
            <ul className="space-y-2 text-sm">
              {participants.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  {p.role === "instructor" && (
                    <span className="text-xs text-blue-400">Host</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )} */}
        <ParticipantsPanel participants={participants} />
      </div>

      if (data.type === "participant") {
        if (data.event === "joined") {
            setShowParticipants(prev => {
            if (prev.find(p => p.user_id === data.user_id)) return prev;
            return [...prev, data];
            });
        }

        if (data.event === "left") {
            setShowParticipants(prev =>
            prev.filter(p => p.user_id !== data.user_id)
            );
        }

        if (data.type === "mute") {
            setShowParticipants(prev =>
                prev.map(p =>
                p.user_id === data.user_id
                    ? { ...p, is_muted: data.is_muted }
                    : p
                )
            );
        }

        if (data.type === "hand") {
            setParticipants(prev =>
                prev.map(p =>
                p.user_id === data.user_id
                    ? { ...p, hand_raised: data.hand_raised }
                    : p
                )
            );
        }

        if (data.type === "reaction") {
            const id = Date.now() + Math.random();

            setReactions(prev => [
                ...prev,
                {
                id,
                emoji: data.emoji,
                x: Math.random() * 80 + 10,
                },
            ]);

            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== id));
            }, 2000);
        }
      }


      <div className="bg-black rounded-lg relative flex items-center justify-center">
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-lg"
        />

        {!cameraOn && (
            <div className="absolute text-gray-400">
            Camera Off
            </div>
        )}

        <span className="absolute bottom-2 left-2 text-xs bg-gray-700 px-2 py-1 rounded">
            You
        </span>
       </div>

       <div className="bg-black rounded-lg">
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-lg"
            />
        </div>

      <p className="text-xs text-green-400 text-center">
        WS: {connected ? "Connected" : "Disconnected"}
      </p>

      {/* BOTTOM CONTROLS */}
      <div className="h-20 bg-gray-800 flex items-center justify-center gap-6">
        
        <button
          onClick={() => setMicOn(!micOn)}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
        >
          {micOn ? <Mic /> : <MicOff />}
        </button>

        <button
          onClick={() => setCameraOn(!cameraOn)}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
        >
          {cameraOn ? <Video /> : <VideoOff />}
        </button>

        <button
          onClick={() => setHandRaised(!handRaised)}
          className={`p-3 rounded-full ${
            handRaised ? "bg-yellow-500" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          <Hand />
        </button>

        <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600">
          <Smile />
        </button>
        <ReactionOverlay reactions={reactions} />

        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
        >
          <Users />
        </button>

        <button className="p-3 rounded-full bg-red-600 hover:bg-red-700">
          <PhoneOff />
        </button>
      </div>
      <LiveControlsBar
        micOn={micOn}
        cameraOn={cameraOn}
        onToggleMic={handleToggleMic}
        onToggleCamera={toggleCamera}
        onRaiseHand={handleRaiseHand}
        onReaction={handleReaction}
        onLeave={() => window.location.href = "/dashboard"}
        />
    </div>
  );
};

export default LiveSessionPage;
