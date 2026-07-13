import React from "react";
import { Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IncomingCallBanner({ callerName, onAccept, onDecline }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] bg-card border shadow-lg rounded-2xl px-4 py-3 flex items-center gap-3">
      <span className="text-sm font-medium">مكالمة واردة من {callerName}</span>
      <Button size="sm" className="gap-1.5" onClick={onAccept}><Phone className="w-3.5 h-3.5" /> قبول</Button>
      <Button size="sm" variant="destructive" className="gap-1.5" onClick={onDecline}><PhoneOff className="w-3.5 h-3.5" /> رفض</Button>
    </div>
  );
}