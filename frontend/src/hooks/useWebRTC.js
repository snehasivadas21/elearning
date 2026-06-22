import { useEffect, useRef } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
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
        const fallback = new MediaStream();
        fallback.addTrack(event.track);
        remoteVideoRef.current.srcObject = fallback;
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendRaw(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
      }
    };

    peer.onconnectionstatechange = () => {
      console.log("WebRTC state:", peer.connectionState);
    };

    const flushPendingCandidates = async () => {
      for (const c of pendingCandidatesRef.current) {
        await peer.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];
    };

    const handleMessage = async (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "offer" && !isInstructor) {
        await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
        await flushPendingCandidates();
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        sendRaw(JSON.stringify({ type: "answer", answer }));
      }

      if (data.type === "answer" && isInstructor) {
        await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
        await flushPendingCandidates();
      }

      if (data.type === "ice-candidate" && data.candidate) {
        if (!peer.remoteDescription) {
          pendingCandidatesRef.current.push(data.candidate);
        } else {
          await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    };

    const removeListener = addMessageListener(handleMessage);

    return () => {
      removeListener();
      peer.close();
    };
  }, [sendRaw, addMessageListener, localStream, isInstructor]);

  const startCall = async () => {
    const peer = peerRef.current;
    if (!peer) return;
    if (peer.signalingState !== "stable" && peer.signalingState !== "closed") {
      console.warn("Peer not in stable state, skipping offer:", peer.signalingState);
      return;
    }
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    sendRaw(JSON.stringify({ type: "offer", offer }));
  };

  return { remoteVideoRef, startCall };
};

export default useWebRTC;