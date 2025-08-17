import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useWebRTC from "../../hooks/useWebRTC";

export default function LiveSessionPage() {
  const { id: sessionId } = useParams();
  const { localVideoRef, remoteVideosRef, peerConnections, localStreamRef, chat, sendChat } = useWebRTC(sessionId);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Sync chat from hook with local state
  useEffect(() => {
    setChatMessages(chat);
  }, [chat]);

  // Use the createPeerConnection from the hook context
  const createPeerConnection = (peerId) => {
    const pc = new RTCPeerConnection();
    peerConnections.current[peerId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      if (!remoteVideosRef.current[peerId]) {
        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.className = "w-48 h-36 bg-black rounded";
        video.srcObject = event.streams[0];
        
        const remoteContainer = document.getElementById("remote-videos");
        if (remoteContainer) {
          remoteContainer.appendChild(video);
        }
        remoteVideosRef.current[peerId] = video;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // WebSocket should be managed by the hook, but keeping this for compatibility
        console.log("ICE candidate:", event.candidate);
      }
    };

    return pc;
  };

  const handleMicToggle = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicOn((prev) => !prev);
    }
  };

  const handleCamToggle = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCamOn((prev) => !prev);
    }
  };

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track for all peer connections
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });
        
        setIsScreenSharing(true);
        
        screenTrack.onended = () => {
          // Restore camera when screen sharing ends
          if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            Object.values(peerConnections.current).forEach((pc) => {
              const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
              if (sender) {
                sender.replaceTrack(videoTrack);
              }
            });
          }
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error("Error sharing screen", err);
      }
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim()) {
      sendChat(chatInput);
      setChatInput("");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Video Section */}
      <div className="flex-1 flex flex-col bg-gray-900 text-white">
        <div className="flex p-2 space-x-2 items-center bg-gray-800">
          <button onClick={handleMicToggle} className="px-3 py-1 bg-blue-600 rounded">
            {isMicOn ? "Mute Mic" : "Unmute Mic"}
          </button>
          <button onClick={handleCamToggle} className="px-3 py-1 bg-blue-600 rounded">
            {isCamOn ? "Turn Off Cam" : "Turn On Cam"}
          </button>
          <button onClick={handleScreenShare} className="px-3 py-1 bg-green-600 rounded">
            {isScreenSharing ? "Stop Sharing" : "Share Screen"}
          </button>
        </div>

        <div className="flex-1 flex p-4 space-x-4 overflow-x-auto">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-48 h-36 bg-black rounded" />
          <div id="remote-videos" className="flex space-x-2"></div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-72 bg-gray-100 flex flex-col">
        <div className="flex-1 p-2 overflow-y-auto">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <span className="font-bold">{msg.from}: </span>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>
        <div className="p-2 border-t flex">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
            placeholder="Type a message..."
            className="flex-1 border rounded p-1"
          />
          <button onClick={handleSendChat} className="ml-2 px-3 py-1 bg-blue-600 text-white rounded">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}