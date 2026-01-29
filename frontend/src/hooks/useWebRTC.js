import { useEffect, useRef } from "react";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const useWebRTC = ({
  socket,
  localStream,
  isInstructor,
}) => {
  const peerRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (!socket || !localStream) return;

    peerRef.current = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    localStream.getTracks().forEach(track => {
      peerRef.current.addTrack(track, localStream);
    });

    // Receive remote stream
    peerRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // ICE candidate
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(JSON.stringify({
          type: "ice-candidate",
          candidate: event.candidate,
        }));
      }
    };

    // Socket messages
    socket.onmessage = async (e) => {
      const data = JSON.parse(e.data);

      if (data.signal_type === "offer" && !isInstructor) {
        await peerRef.current.setRemoteDescription(data.offer);

        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);

        socket.send(JSON.stringify({
          type: "answer",
          answer,
        }));
      }

      if (data.signal_type === "answer" && isInstructor) {
        await peerRef.current.setRemoteDescription(data.answer);
      }

      if (data.signal_type === "ice-candidate") {
        await peerRef.current.addIceCandidate(data.candidate);
      }
    };

    return () => peerRef.current?.close();
  }, [socket, localStream]);

  const startCall = async () => {
    if (!peerRef.current) return;

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socket.send(JSON.stringify({
      type: "offer",
      offer,
    }));
  };

  return {
    remoteVideoRef,
    startCall,
  };
};

export default useWebRTC;
