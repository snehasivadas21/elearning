import { useEffect, useRef } from "react";

// Multiple STUN servers. Chrome is stricter about ICE than Edge/Firefox.
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

// Props changed: instead of receiving the raw socket object,
// it receives sendRaw (function to send a JSON string) and
// addMessageListener (function to attach a message handler).
// This avoids the stale-ref problem entirely.
const useWebRTC = ({ sendRaw, addMessageListener, localStream, isInstructor }) => {
  const peerRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  useEffect(() => {
    if (!sendRaw || !addMessageListener || !localStream) return;

    const peer = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = peer;
    pendingCandidatesRef.current = [];

    localStream.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });

    // Chrome sometimes fires ontrack with event.streams[0] undefined.
    // Fallback: wrap the track in a new MediaStream.
    peer.ontrack = (event) => {
      if (!remoteVideoRef.current) return;

      const stream = event.streams?.[0];
      if (stream) {
        remoteVideoRef.current.srcObject = stream;
      } else {
        const fallbackStream = new MediaStream();
        fallbackStream.addTrack(event.track);
        remoteVideoRef.current.srcObject = fallbackStream;
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendRaw(
          JSON.stringify({
            type: "ice-candidate",
            candidate: event.candidate,
          })
        );
      }
    };

    // Queue-safe candidate addition.
    // Chrome throws if addIceCandidate is called before
    // setRemoteDescription. Queue them and flush after.
    const addCandidateSafe = async (candidate) => {
      if (!peer.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
      } else {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const flushPendingCandidates = async () => {
      for (const candidate of pendingCandidatesRef.current) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];
    };

    const handleMessage = async (e) => {
      const data = JSON.parse(e.data);

      // Student receives offer from tutor
      if (data.type === "offer" && !isInstructor) {
        await peer.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        await flushPendingCandidates();

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        sendRaw(
          JSON.stringify({
            type: "answer",
            answer,
          })
        );
      }

      // Tutor receives answer from student
      if (data.type === "answer" && isInstructor) {
        await peer.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        await flushPendingCandidates();
      }

      // ICE candidate — queue-safe
      if (data.type === "ice-candidate" && data.candidate) {
        await addCandidateSafe(data.candidate);
      }
    };

    // Attach listener via the hook's helper — returns cleanup fn
    const removeListener = addMessageListener(handleMessage);

    return () => {
      removeListener();
      peer.close();
    };
  }, [sendRaw, addMessageListener, localStream, isInstructor]);

  const startCall = async () => {
    if (!peerRef.current) return;

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    sendRaw(
      JSON.stringify({
        type: "offer",
        offer,
      })
    );
  };

  return {
    remoteVideoRef,
    startCall,
  };
};

export default useWebRTC;