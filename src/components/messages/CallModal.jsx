import React, { useEffect, useRef, useState } from "react";
import { PhoneOff, Monitor, MonitorOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function CallModal({ channelId, currentUser, peerEmail, peerName, isCaller, incomingOffer, onClose }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const connectedAtRef = useRef(null);
  const loggedRef = useRef(false);

  const logCallMessage = async (status) => {
    if (!isCaller || loggedRef.current) return;
    loggedRef.current = true;
    const duration = connectedAtRef.current ? Math.round((Date.now() - connectedAtRef.current) / 1000) : 0;
    await base44.entities.ChannelMessage.create({
      channel_id: channelId,
      author_name: currentUser.full_name,
      author_email: currentUser.email,
      message_type: "مكالمة",
      call_status: status,
      call_duration: duration,
    }).catch(() => {});
  };

  useEffect(() => {
    let unsubscribe;
    const setup = async () => {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (err) {
        alert("تعذر الوصول إلى الكاميرا أو الميكروفون. تأكد من منح الأذونات اللازمة.");
        onClose();
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        setConnected(true);
        connectedAtRef.current = Date.now();
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          base44.entities.CallSignal.create({
            channel_id: channelId,
            from_email: currentUser.email,
            from_name: currentUser.full_name,
            to_email: peerEmail,
            type: "ice-candidate",
            payload: JSON.stringify(e.candidate),
          });
        }
      };

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await base44.entities.CallSignal.create({
          channel_id: channelId,
          from_email: currentUser.email,
          from_name: currentUser.full_name,
          to_email: peerEmail,
          type: "offer",
          payload: JSON.stringify(offer),
        });
        await base44.entities.Notification.create({
          recipient_email: peerEmail,
          title: `مكالمة واردة من ${currentUser.full_name}`,
          message: "اضغط للانضمام إلى المكالمة",
          channel_id: channelId,
        });
      } else {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await base44.entities.CallSignal.create({
          channel_id: channelId,
          from_email: currentUser.email,
          from_name: currentUser.full_name,
          to_email: peerEmail,
          type: "answer",
          payload: JSON.stringify(answer),
        });
      }

      unsubscribe = base44.entities.CallSignal.subscribe(async (event) => {
        if (event.type !== "create") return;
        const s = event.data;
        if (s.channel_id !== channelId || s.to_email !== currentUser.email || s.from_email !== peerEmail) return;
        if (s.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(s.payload)));
        } else if (s.type === "ice-candidate") {
          try { await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(s.payload))); } catch (e) {}
        } else if (s.type === "hangup") {
          logCallMessage(connectedAtRef.current ? "مكتملة" : "فائتة");
          cleanup();
          onClose();
        }
        base44.entities.CallSignal.delete(s.id);
      });
    };
    setup().catch(() => { onClose(); });

    return () => {
      unsubscribe?.();
      cleanup();
      logCallMessage(connectedAtRef.current ? "مكتملة" : "فائتة");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenTrackRef.current?.stop();
  };

  const handleHangup = async () => {
    await base44.entities.CallSignal.create({
      channel_id: channelId,
      from_email: currentUser.email,
      from_name: currentUser.full_name,
      to_email: peerEmail,
      type: "hangup",
    });
    await logCallMessage(connectedAtRef.current ? "مكتملة" : "فائتة");
    cleanup();
    onClose();
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      let screenStream;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      } catch (err) {
        return;
      }
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
      sender?.replaceTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      screenTrack.onended = () => stopScreenShare();
      setIsScreenSharing(true);
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pcRef.current?.getSenders().find((s) => s.track && s.track.kind === "video");
    if (sender && camTrack) sender.replaceTrack(camTrack);
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    screenTrackRef.current?.stop();
    setIsScreenSharing(false);
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4">
      <p className="text-white text-sm mb-3">{connected ? `مكالمة مع ${peerName}` : `جاري الاتصال ب${peerName}...`}</p>
      <div className="relative w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-3 left-3 w-32 rounded-xl border-2 border-white/50 object-cover" />
      </div>
      <div className="flex items-center gap-3 mt-5">
        <Button size="icon" variant={micOn ? "secondary" : "destructive"} onClick={toggleMic}>{micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}</Button>
        <Button size="icon" variant={camOn ? "secondary" : "destructive"} onClick={toggleCam}>{camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}</Button>
        <Button size="icon" variant={isScreenSharing ? "default" : "secondary"} onClick={toggleScreenShare}>{isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}</Button>
        <Button size="icon" variant="destructive" onClick={handleHangup}><PhoneOff className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}