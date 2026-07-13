import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Circle, Square, X, Send, Mic } from "lucide-react";

const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function AudioRecorderModal({ onCapture, onClose }) {
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch {
        onClose();
      }
    })();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = () => {
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "audio/webm" });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioFile(new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" }));
      setPreviewUrl(URL.createObjectURL(blob));
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const handleSend = () => {
    if (audioFile) onCapture(audioFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm flex flex-col items-center gap-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${recording ? "bg-destructive/10" : "bg-muted"}`}>
          <Mic className={`w-8 h-8 ${recording ? "text-destructive" : "text-muted-foreground"}`} />
        </div>
        <p className="text-sm font-mono">{formatTime(seconds)}</p>
        {previewUrl && <audio src={previewUrl} controls className="w-full" />}
        <div className="flex items-center gap-3">
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
    </div>
  );
}