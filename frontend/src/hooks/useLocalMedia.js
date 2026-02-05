import { useEffect, useRef, useState } from "react";

const useLocalMedia = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [stream, setStream] = useState(null); // ✅ FIX 1: expose stream as state
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const startMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = mediaStream;
        setStream(mediaStream); // ✅ FIX 1: set it so consumers can use it

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Media error", err);
        setError("Camera or microphone permission denied");
      }
    };

    startMedia();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleMic = () => {
    streamRef.current
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    setMicOn((prev) => !prev);
  };

  const toggleCamera = () => {
    streamRef.current
      ?.getVideoTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    setCameraOn((prev) => !prev);
  };

  return {
    videoRef,
    stream,       // ✅ FIX 1: now returned — was missing entirely before
    micOn,
    cameraOn,
    toggleMic,
    toggleCamera,
    error,
  };
};

export default useLocalMedia;