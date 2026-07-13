import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Circle, Square, X, Send, Camera, CameraOff, Monitor } from "lucide-react";

const MAX_SECONDS = 300;

const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function VideoRecorderModal({ onCapture, onClose }) {
  const videoRef = useRef(null); // raw camera preview OR raw screen feed (source for canvas)
  const camOverlayRef = useRef(null); // hidden camera bubble source (screen mode)
  const canvasRef = useRef(null); // visible composited preview (screen mode)

  const screenStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const camStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mixedAudioTrackRef = useRef(null);
  const canvasStreamRef = useRef(null);
  const rafRef = useRef(null);
  const cameraOverlayRef = useRef(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [source, setSource] = useState("camera");
  const [cameraOverlay, setCameraOverlay] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => { cameraOverlayRef.current = cameraOverlay; }, [cameraOverlay]);

  const stopAllStreams = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    canvasStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    screenStreamRef.current = null;
    micStreamRef.current = null;
    camStreamRef.current = null;
    canvasStreamRef.current = null;
    audioCtxRef.current = null;
    cancelAnimationFrame(rafRef.current);
  };

  const drawLoop = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && video.videoWidth) {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (cameraOverlayRef.current && camOverlayRef.current?.videoWidth) {
        const size = Math.min(canvas.width, canvas.height) * 0.22;
        const x = canvas.width - size - 24;
        const y = canvas.height - size - 24;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(camOverlayRef.current, x, y, size, size);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    rafRef.current = requestAnimationFrame(drawLoop);
  };

  const setupScreenMode = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = screenStream;
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
        await videoRef.current.play().catch(() => {});
      }

      let micStream = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = micStream;
      } catch {
        micStream = null;
      }

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();
      if (screenStream.getAudioTracks().length > 0) {
        audioCtx.createMediaStreamSource(new MediaStream(screenStream.getAudioTracks())).connect(dest);
      }
      if (micStream) {
        audioCtx.createMediaStreamSource(micStream).connect(dest);
      }
      mixedAudioTrackRef.current = dest.stream.getAudioTracks()[0] || null;

      rafRef.current = requestAnimationFrame(drawLoop);
      setReady(true);
    } catch {
      onClose();
    }
  };

  const setupCameraMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      camStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setReady(true);
    } catch {
      onClose();
    }
  };

  useEffect(() => {
    stopAllStreams();
    setReady(false);
    if (source === "screen") setupScreenMode();
    else setupCameraMode();
    return () => stopAllStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    if (source !== "screen") return;
    if (cameraOverlay && !camStreamRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          camStreamRef.current = stream;
          if (camOverlayRef.current) {
            camOverlayRef.current.srcObject = stream;
            camOverlayRef.current.play().catch(() => {});
          }
        })
        .catch(() => setCameraOverlay(false));
    } else if (!cameraOverlay && camStreamRef.current) {
      camStreamRef.current.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOverlay, source]);

  const handleSourceChange = (src) => {
    if (recording || previewUrl || src === source) return;
    setCameraOverlay(false);
    setSource(src);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const startRecording = () => {
    chunksRef.current = [];
    let streamToRecord;
    if (source === "screen") {
      canvasStreamRef.current = canvasRef.current.captureStream(30);
      const videoTracks = canvasStreamRef.current.getVideoTracks();
      const audioTrack = mixedAudioTrackRef.current;
      streamToRecord = new MediaStream([...videoTracks, ...(audioTrack ? [audioTrack] : [])]);
    } else {
      streamToRecord = camStreamRef.current;
    }
    const recorder = new MediaRecorder(streamToRecord, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoFile(new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" }));
      setPreviewUrl(URL.createObjectURL(blob));
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) {
          stopRecording();
          return MAX_SECONDS;
        }
        return s + 1;
      });
    }, 1000);
  };

  const handleSend = () => {
    if (videoFile) onCapture(videoFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4">
      {!previewUrl && !recording && (
        <div className="flex items-center gap-2 mb-3">
          <Button size="sm" variant={source === "camera" ? "default" : "secondary"} className="gap-1.5" onClick={() => handleSourceChange("camera")}>
            <Camera className="w-3.5 h-3.5" /> الكاميرا
          </Button>
          <Button size="sm" variant={source === "screen" ? "default" : "secondary"} className="gap-1.5" onClick={() => handleSourceChange("screen")}>
            <Monitor className="w-3.5 h-3.5" /> مشاركة الشاشة
          </Button>
        </div>
      )}
      <div className="relative w-full max-w-md aspect-video bg-black rounded-2xl overflow-hidden">
        {previewUrl ? (
          <video src={previewUrl} controls className="w-full h-full object-cover" />
        ) : source === "screen" ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            <video ref={camOverlayRef} autoPlay playsInline muted className="hidden" />
            <canvas ref={canvasRef} className="w-full h-full object-contain bg-black" />
          </>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
        {recording && (
          <span className="absolute top-3 left-3 bg-destructive text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Circle className="w-2 h-2 fill-white" /> {formatTime(seconds)} / {formatTime(MAX_SECONDS)}
          </span>
        )}
        {!previewUrl && source === "screen" && ready && (
          <button
            type="button"
            onClick={() => setCameraOverlay((v) => !v)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-2 rounded-full flex items-center gap-1.5"
          >
            {cameraOverlay ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            {cameraOverlay ? "إغلاق الكاميرا" : "إظهار الكاميرا"}
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 mt-5">
        <Button size="icon" variant="secondary" onClick={onClose}><X className="w-4 h-4" /></Button>
        {!previewUrl && !recording && (
          <Button size="icon" variant="destructive" onClick={startRecording} disabled={!ready}><Circle className="w-4 h-4" /></Button>
        )}
        {recording && (
          <Button size="icon" variant="destructive" onClick={stopRecording}><Square className="w-4 h-4" /></Button>
        )}
        {previewUrl && (
          <Button size="icon" onClick={handleSend}><Send className="w-4 h-4" /></Button>
        )}
      </div>
    </div>
  );
}