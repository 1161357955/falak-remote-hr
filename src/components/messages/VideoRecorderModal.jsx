import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Circle, Square, X, Send, Camera, Monitor } from "lucide-react";

const MAX_SECONDS = 300;

const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function VideoRecorderModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [source, setSource] = useState("camera");

  const openStream = async (src) => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = src === "screen"
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      onClose();
    }
  };

  useEffect(() => {
    openStream("camera");
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSourceChange = (src) => {
    if (recording || previewUrl) return;
    setSource(src);
    openStream(src);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const startRecording = () => {
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
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
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
        {recording && (
          <span className="absolute top-3 left-3 bg-destructive text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Circle className="w-2 h-2 fill-white" /> {formatTime(seconds)} / {formatTime(MAX_SECONDS)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-5">
        <Button size="icon" variant="secondary" onClick={onClose}><X className="w-4 h-4" /></Button>
        {!previewUrl && !recording && (
          <Button size="icon" variant="destructive" onClick={startRecording}><Circle className="w-4 h-4" /></Button>
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