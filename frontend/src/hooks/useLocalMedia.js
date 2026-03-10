import { useEffect, useRef, useState } from "react";

const useLocalMedia = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const startMedia = async () => {
      const constraints = [
        { video: true, audio: true },
        { video: false, audio: true },
      ];

      for (const constraint of constraints) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia(
            constraint
          );

          if (cancelled) {
            mediaStream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = mediaStream;
          setStream(mediaStream);
          setCameraOn(constraint.video !== false); 

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }

          setError(null);
          return; 
        } catch (err) {
          const isDeviceBusy =
            err.name === "NotReadableError" ||
            err.name === "AbortError" ||
            err.name === "TrackStartError";

          const isPermissionDenied =
            err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError";

          if (isPermissionDenied) {
            setError("Camera or microphone permission denied.");
            return; 
          }

          if (isDeviceBusy && constraint.video) {
            console.warn("Camera busy, falling back to audio only:", err.message);
            continue;
          }

          console.error("Media error", err);
          setError(`Could not access media: ${err.message}`);
          return;
        }
      }

      setError("Camera is in use by another tab or application.");
    };

    startMedia();

    return () => {
      cancelled = true;
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
    stream,
    micOn,
    cameraOn,
    toggleMic,
    toggleCamera,
    error,
  };
};

export default useLocalMedia;