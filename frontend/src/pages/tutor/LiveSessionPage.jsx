import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";


export default function LiveSessionPage() {
  const { sessionId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const peerConnections = useRef({});
  const [ws, setWs] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localStreamRef = useRef(null);

  // Connect to WebSocket signaling server
  useEffect(() => {
    const socket = new WebSocket(
      `wss://your-backend-domain/ws/live/${sessionId}/`
    );

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      const { type, from, offer, answer, candidate, message } = data;

      if (type === "offer") {
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answerDesc = await pc.createAnswer();
        await pc.setLocalDescription(answerDesc);
        socket.send(
          JSON.stringify({ type: "answer", to: from, answer: answerDesc })
        );
      }

      if (type === "answer" && peerConnections.current[from]) {
        await peerConnections.current[from].setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }

      if (type === "candidate" && peerConnections.current[from]) {
        try {
          await peerConnections.current[from].addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (e) {
          console.error("Error adding received ICE candidate", e);
        }
      }

      if (type === "chat") {
        setChatMessages((prev) => [...prev, { from, text: message }]);
      }
    };

    socket.onopen = () => {
      console.log("Connected to signaling server");
    };

    setWs(socket);
    return () => socket.close();
  }, [sessionId]);

  // Get user media
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices", err);
      }
    })();
  }, []);

  const createPeerConnection = (peerId) => {
    const pc = new RTCPeerConnection();

    peerConnections.current[peerId] = pc;

    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.ontrack = (event) => {
      if (!remoteVideosRef.current[peerId]) {
        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.className = "w-48 h-36 bg-black rounded";
        video.srcObject = event.streams[0];
        document.getElementById("remote-videos").appendChild(video);
        remoteVideosRef.current[peerId] = video;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(
          JSON.stringify({
            type: "candidate",
            to: peerId,
            candidate: event.candidate,
          })
        );
      }
    };

    return pc;
  };

  const handleMicToggle = () => {
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMicOn((prev) => !prev);
  };

  const handleCamToggle = () => {
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCamOn((prev) => !prev);
  };

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = Object.values(peerConnections.current)[0]
          ?.getSenders()
          .find((s) => s.track.kind === "video");
        sender.replaceTrack(screenTrack);
        setIsScreenSharing(true);
        screenTrack.onended = () => {
          sender.replaceTrack(localStreamRef.current.getVideoTracks()[0]);
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error("Error sharing screen", err);
      }
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim() && ws) {
      ws.send(JSON.stringify({ type: "chat", message: chatInput }));
      setChatMessages((prev) => [...prev, { from: "Me", text: chatInput }]);
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
            Share Screen
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
