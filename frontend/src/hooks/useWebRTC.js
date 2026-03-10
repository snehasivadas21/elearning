import { useEffect, useRef } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

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

      if (data.type === "answer" && isInstructor) {
        await peer.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        await flushPendingCandidates();
      }

      if (data.type === "ice-candidate" && data.candidate) {
        await addCandidateSafe(data.candidate);
      }
    };

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