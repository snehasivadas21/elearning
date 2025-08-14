// src/hooks/useWebRTC.js
import { useEffect, useRef, useState } from "react";

/**
 * useWebRTC
 * - Connects to Django Channels at:  ws(s)://<WS_BASE>/ws/live/<session_id>/?token=<jwt or drf token>
 * - Minimal P2P mesh: join -> receive "peers" -> make offers -> exchange ICE
 * - Chat via same WS ("chat" events)
 */
export default function useWebRTC({ sessionId, token, wsBase }) {
  const [chat, setChat] = useState([]);                 // {from, text, ts}
  const [ready, setReady] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]); // [{peerId, stream}]
  const wsRef = useRef(null);
  const pcs = useRef({}); // peerId -> RTCPeerConnection
  const streamsByPeer = useRef({}); // peerId -> MediaStream

  // --- helpers
  const sendWS = (msg) => wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify(msg));

  const addRemoteTrackHandler = (peerId, pc) => {
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      streamsByPeer.current[peerId] = stream;
      setRemoteStreams((prev) => {
        const existing = prev.find((p) => p.peerId === peerId);
        if (existing) return prev.map((p) => (p.peerId === peerId ? { peerId, stream } : p));
        return [...prev, { peerId, stream }];
      });
    };
  };

  const createPC = (peerId) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcs.current[peerId] = pc;

    // Add local tracks
    localStream?.getTracks().forEach((t) => pc.addTrack(t, localStream));
    addRemoteTrackHandler(peerId, pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) sendWS({ type: "ice-candidate", to: peerId, candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        delete pcs.current[peerId];
        setRemoteStreams((prev) => prev.filter((p) => p.peerId !== peerId));
      }
    };

    return pc;
  };

  // --- init media + websocket
  useEffect(() => {
    let mounted = true;

    (async () => {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!mounted) return;
      setLocalStream(media);

      const url = `${wsBase.replace(/\/$/, "")}/ws/live/${sessionId}/?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setReady(true);
        sendWS({ type: "join" }); // tells server we’re in the room
      };

      ws.onmessage = async (evt) => {
        const msg = JSON.parse(evt.data);

        switch (msg.type) {
          case "peers": {
            // server sends current peer IDs; create offers to each
            for (const peerId of msg.ids) {
              if (pcs.current[peerId]) continue;
              const pc = createPC(peerId);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendWS({ type: "offer", to: peerId, offer });
            }
            break;
          }

          case "offer": {
            const { from, offer } = msg;
            const pc = pcs.current[from] || createPC(from);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendWS({ type: "answer", to: from, answer });
            break;
          }

          case "answer": {
            const { from, answer } = msg;
            const pc = pcs.current[from];
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
            break;
          }

          case "ice-candidate": {
            const { from, candidate } = msg;
            const pc = pcs.current[from];
            if (pc && candidate) {
              try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
            }
            break;
          }

          case "chat": {
            setChat((c) => [...c, { from: msg.from_name || msg.from, text: msg.message, ts: Date.now() }]);
            break;
          }

          case "left": {
            const { peerId } = msg;
            pcs.current[peerId]?.close();
            delete pcs.current[peerId];
            setRemoteStreams((prev) => prev.filter((p) => p.peerId !== peerId));
            break;
          }

          default:
            break;
        }
      };

      ws.onclose = () => {
        Object.values(pcs.current).forEach((pc) => pc.close());
        pcs.current = {};
        streamsByPeer.current = {};
      };
    })();

    return () => {
      mounted = false;
      wsRef.current?.close();
      localStream?.getTracks().forEach((t) => t.stop());
      Object.values(pcs.current).forEach((pc) => pc.close());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token, wsBase]);

  // --- controls
  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
  };
  const toggleCam = () => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
  };
  const startScreenShare = async () => {
    const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screen.getVideoTracks()[0];
    // replace outgoing video track for all peers
    Object.values(pcs.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender) sender.replaceTrack(screenTrack);
    });
    // also replace local preview
    const [old] = localStream.getVideoTracks();
    old.stop();
    localStream.removeTrack(old);
    localStream.addTrack(screenTrack);
    screenTrack.onended = async () => {
      const cam = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = cam.getVideoTracks()[0];
      Object.values(pcs.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });
      localStream.removeTrack(screenTrack);
      localStream.addTrack(camTrack);
    };
  };
  const sendChat = (text) => {
    if (!text?.trim()) return;
    sendWS({ type: "chat", message: text });
    setChat((c) => [...c, { from: "Me", text, ts: Date.now() }]);
  };

  return {
    ready,
    localStream,
    remoteStreams, // array of {peerId, stream}
    toggleMic,
    toggleCam,
    startScreenShare,
    chat,
    sendChat,
  };
}
