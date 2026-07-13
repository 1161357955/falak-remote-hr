import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import ChatSidebar from "@/components/messages/ChatSidebar";
import ChatThread from "@/components/messages/ChatThread";
import CallModal from "@/components/messages/CallModal";
import IncomingCallBanner from "@/components/messages/IncomingCallBanner";
import FormDialog from "@/components/shared/FormDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: "", description: "" });
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const { toast } = useToast();
  const selectedIdRef = useRef(null);
  const currentUserRef = useRef(null);

  useEffect(() => { init(); }, []);

  useEffect(() => {
    selectedIdRef.current = selectedChannel?.id || null;
    if (selectedChannel) loadMessages(selectedChannel.id);
    else setMessages([]);
  }, [selectedChannel]);

  useEffect(() => {
    const unsubscribe = base44.entities.ChannelMessage.subscribe((event) => {
      if (event.type === "create" && event.data?.channel_id === selectedIdRef.current) {
        setMessages((prev) => [...prev, event.data]);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = base44.entities.CallSignal.subscribe((event) => {
      if (event.type !== "create") return;
      const s = event.data;
      const me = currentUserRef.current?.email;
      if (s.type === "offer" && s.to_email === me) {
        setIncomingCall(s);
      }
    });
    return unsubscribe;
  }, []);

  const init = async () => {
    try {
      const [user, w, c] = await Promise.all([
        base44.auth.me(),
        base44.entities.RemoteWorker.list(),
        base44.entities.Channel.list("created_date"),
      ]);
      setCurrentUser(user);
      currentUserRef.current = user;
      setWorkers(w);
      let allChannels = c;
      const hasGeneral = c.some((ch) => ch.type === "قناة عامة" && ch.name === "عام");
      if (!hasGeneral) {
        const general = await base44.entities.Channel.create({
          name: "عام",
          description: "القناة العامة لكافة أعضاء الفريق",
          type: "قناة عامة",
          created_by_email: user.email,
        });
        allChannels = [general, ...c];
      }
      setChannels(allChannels);
      setSelectedChannel(allChannels.find((ch) => ch.type === "قناة عامة") || allChannels[0] || null);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId) => {
    const msgs = await base44.entities.ChannelMessage.filter({ channel_id: channelId }, "created_date");
    setMessages(msgs);
  };

  const handleSend = async ({ content, file_url }) => {
    await base44.entities.ChannelMessage.create({
      channel_id: selectedChannel.id,
      content,
      file_url,
      author_name: currentUser?.full_name,
      author_email: currentUser?.email,
    });
  };

  const handleCreateChannel = async () => {
    if (!newChannel.name.trim()) {
      toast({ title: "خطأ", description: "اسم القناة مطلوب", variant: "destructive" });
      return;
    }
    const channel = await base44.entities.Channel.create({
      name: newChannel.name.trim(),
      description: newChannel.description,
      type: "قناة عامة",
      created_by_email: currentUser?.email,
    });
    setChannels((prev) => [...prev, channel]);
    setSelectedChannel(channel);
    setDialogOpen(false);
    setNewChannel({ name: "", description: "" });
  };

  const handleStartDM = async (worker) => {
    let existing = channels.find(
      (c) =>
        c.type === "محادثة مباشرة" &&
        (c.participant_emails || []).includes(worker.email) &&
        (c.participant_emails || []).includes(currentUser?.email)
    );
    if (!existing) {
      existing = await base44.entities.Channel.create({
        name: `${currentUser?.full_name} و ${worker.full_name}`,
        type: "محادثة مباشرة",
        participant_emails: [currentUser?.email, worker.email],
        created_by_email: currentUser?.email,
      });
      setChannels((prev) => [...prev, existing]);
    }
    setSelectedChannel(existing);
  };

  const handleStartCall = () => {
    if (!selectedChannel || selectedChannel.type !== "محادثة مباشرة") return;
    const peerEmail = (selectedChannel.participant_emails || []).find((e) => e !== currentUser?.email);
    setActiveCall({ channelId: selectedChannel.id, peerEmail, peerName: getDmLabel(), isCaller: true });
  };

  const handleAcceptCall = () => {
    setActiveCall({
      channelId: incomingCall.channel_id,
      peerEmail: incomingCall.from_email,
      peerName: incomingCall.from_name || incomingCall.from_email,
      isCaller: false,
      incomingOffer: JSON.parse(incomingCall.payload),
    });
    base44.entities.CallSignal.delete(incomingCall.id);
    setIncomingCall(null);
  };

  const handleDeclineCall = async () => {
    await base44.entities.CallSignal.create({
      channel_id: incomingCall.channel_id,
      from_email: currentUser.email,
      from_name: currentUser.full_name,
      to_email: incomingCall.from_email,
      type: "hangup",
    });
    base44.entities.CallSignal.delete(incomingCall.id);
    setIncomingCall(null);
  };

  const getDmLabel = () => {
    if (!selectedChannel || selectedChannel.type !== "محادثة مباشرة") return "";
    const otherEmail = (selectedChannel.participant_emails || []).find((e) => e !== currentUser?.email);
    return workers.find((w) => w.email === otherEmail)?.full_name || otherEmail;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="الاتصالات الداخلية" description="تواصل مع فريق العمل عبر القنوات والمحادثات المباشرة" />
      <div className="flex flex-col lg:flex-row gap-4">
        <ChatSidebar
          channels={channels}
          workers={workers}
          currentUser={currentUser}
          selectedId={selectedChannel?.id}
          onSelect={setSelectedChannel}
          onCreateChannel={() => setDialogOpen(true)}
          onStartDM={handleStartDM}
        />
        <ChatThread
          channel={selectedChannel}
          messages={messages}
          currentUser={currentUser}
          dmLabel={getDmLabel()}
          onSend={handleSend}
          onStartCall={handleStartCall}
        />
      </div>

      {incomingCall && !activeCall && (
        <IncomingCallBanner
          callerName={incomingCall.from_name || incomingCall.from_email}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {activeCall && (
        <CallModal
          channelId={activeCall.channelId}
          currentUser={currentUser}
          peerEmail={activeCall.peerEmail}
          peerName={activeCall.peerName}
          isCaller={activeCall.isCaller}
          incomingOffer={activeCall.incomingOffer}
          onClose={() => setActiveCall(null)}
        />
      )}

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="قناة جديدة">
        <div className="space-y-4">
          <div><Label>اسم القناة *</Label><Input value={newChannel.name} onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })} /></div>
          <div><Label>الوصف</Label><Textarea value={newChannel.description} onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })} /></div>
          <Button onClick={handleCreateChannel} className="w-full">إنشاء القناة</Button>
        </div>
      </FormDialog>
    </div>
  );
}