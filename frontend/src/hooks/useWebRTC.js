import { useEffect, useRef, useState } from "react";

export default function useWebRTC(sessionId) {
  // Return the interface that LiveSessionPage expects
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const peerConnections = useRef({});
  const localStreamRef = useRef(null);

  // Internal state for the hook functionality
  const [chat, setChat] = useState([]);                 
  const [ready, setReady] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState([]); 
  const wsRef = useRef(null);
  const streamsByPeer = useRef({}); 

  
  const sendWS = (msg) => wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify(msg));

  const addRemoteTrackHandler = (peerId, pc) => {
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      streamsByPeer.current[peerId] = stream;
      
      // Create video element and add to remoteVideosRef for compatibility
      if (!remoteVideosRef.current[peerId]) {
        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.className = "w-48 h-36 bg-black rounded";
        video.srcObject = stream;
        remoteVideosRef.current[peerId] = video;
      }
      
      setRemoteStreams((prev) => {
        const existing = prev.find((p) => p.peerId === peerId);
        if (existing) return prev.map((p) => (p.peerId === peerId ? { peerId, stream } : p));
        return [...prev, { peerId, stream }];
      });
    };
  };

  const createPC = (peerId) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerConnections.current[peerId] = pc; // Use the expected reference

    // Add local tracks
    localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
    addRemoteTrackHandler(peerId, pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) sendWS({ type: "candidate", to: peerId, candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        delete peerConnections.current[peerId];
        delete remoteVideosRef.current[peerId];
        setRemoteStreams((prev) => prev.filter((p) => p.peerId !== peerId));
      }
    };

    return pc;
  };

  // --- init media + websocket
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        
        localStreamRef.current = media;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = media;
        }

        // Fixed WebSocket URL - removed duplicate protocol
        const url = `ws://localhost:8000/ws/live/${sessionId}/`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("Connected to signaling server");
          setReady(true);
        };

        ws.onmessage = async (evt) => {
          const msg = JSON.parse(evt.data);
          const { type, from, offer, answer, candidate, message } = msg;

          switch (type) {
            case "offer": {
              const pc = createPC(from);
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
              const answerDesc = await pc.createAnswer();
              await pc.setLocalDescription(answerDesc);
              sendWS({ type: "answer", to: from, answer: answerDesc });
              break;
            }

            case "answer": {
              const pc = peerConnections.current[from];
              if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
              break;
            }

            case "candidate": {
              const pc = peerConnections.current[from];
              if (pc && candidate) {
                try { 
                  await pc.addIceCandidate(new RTCIceCandidate(candidate)); 
                } catch (e) {
                  console.error("Error adding received ICE candidate", e);
                }
              }
              break;
            }

            case "chat": {
              setChat((c) => [...c, { from, text: message, ts: Date.now() }]);
              break;
            }

            case "left": {
              const { peerId } = msg;
              peerConnections.current[peerId]?.close();
              delete peerConnections.current[peerId];
              delete remoteVideosRef.current[peerId];
              setRemoteStreams((prev) => prev.filter((p) => p.peerId !== peerId));
              break;
            }

            default:
              break;
          }
        };

        ws.onclose = () => {
          Object.values(peerConnections.current).forEach((pc) => pc.close());
          peerConnections.current = {};
          remoteVideosRef.current = {};
          streamsByPeer.current = {};
        };
      } catch (err) {
        console.error("Error accessing media devices", err);
      }
    })();

    return () => {
      mounted = false;
      wsRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(peerConnections.current).forEach((pc) => pc.close());
    };
   
  }, [sessionId]);

  // --- controls (keeping these for potential future use)
  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
  };
  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
  };
  const startScreenShare = async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screen.getVideoTracks()[0];
      
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      
      screenTrack.onended = async () => {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = cam.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(camTrack);
        });
      };
    } catch (err) {
      console.error("Error sharing screen", err);
    }
  };
  const sendChat = (text) => {
    if (!text?.trim()) return;
    sendWS({ type: "chat", message: text });
    setChat((c) => [...c, { from: "Me", text, ts: Date.now() }]);
  };

  // Return the interface expected by LiveSessionPage
  return {
    localVideoRef,
    remoteVideosRef,
    peerConnections,
    localStreamRef,
    // Additional utilities
    ready,
    chat,
    toggleMic,
    toggleCam,
    startScreenShare,
    sendChat,
  };
}