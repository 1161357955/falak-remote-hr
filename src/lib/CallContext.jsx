import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import CallModal from "@/components/messages/CallModal";
import IncomingCallBanner from "@/components/messages/IncomingCallBanner";

const CallContext = createContext(null);

export function useCall() {
  return useContext(CallContext);
}

export function CallProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const currentUserRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setCurrentUser(u);
      currentUserRef.current = u;
    }).catch(() => {});
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

  const startCall = ({ channelId, peerEmail, peerName }) => {
    setActiveCall({ channelId, peerEmail, peerName, isCaller: true });
  };

  const acceptCall = () => {
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

  const declineCall = async () => {
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

  return (
    <CallContext.Provider value={{ startCall }}>
      {children}
      {incomingCall && !activeCall && (
        <IncomingCallBanner
          callerName={incomingCall.from_name || incomingCall.from_email}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}
      {activeCall && currentUser && (
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
    </CallContext.Provider>
  );
}