import React, { useState } from "react";
import { Hash, MessageCircle, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatSidebar({ channels, workers, currentUser, selectedId, onSelect, onCreateChannel, onStartDM }) {
  const [search, setSearch] = useState("");

  const publicChannels = channels.filter((c) => c.type === "قناة عامة");
  const directChannels = channels.filter(
    (c) => c.type === "محادثة مباشرة" && (c.participant_emails || []).includes(currentUser?.email)
  );

  const getDmLabel = (c) => {
    const otherEmail = (c.participant_emails || []).find((e) => e !== currentUser?.email);
    return workers.find((w) => w.email === otherEmail)?.full_name || otherEmail || c.name;
  };

  const otherWorkers = workers.filter((w) => w.email && w.email !== currentUser?.email);

  return (
    <div className="w-full lg:w-64 shrink-0 bg-card border rounded-2xl overflow-hidden flex flex-col max-h-[75vh]">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-8 h-8 text-xs" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground">القنوات</span>
            <button onClick={onCreateChannel} title="قناة جديدة" className="text-muted-foreground hover:text-foreground">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {publicChannels
              .filter((c) => c.name.includes(search))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={`w-full flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg text-right ${
                    selectedId === c.id ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{c.name}</span>
                </button>
              ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-muted-foreground">المحادثات المباشرة</span>
          <div className="space-y-0.5 mt-1.5">
            {directChannels.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`w-full flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg text-right ${
                  selectedId === c.id ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{getDmLabel(c)}</span>
              </button>
            ))}
          </div>
          {otherWorkers.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {otherWorkers
                .filter((w) => !directChannels.some((c) => (c.participant_emails || []).includes(w.email)) && w.full_name.includes(search))
                .map((w) => (
                  <button
                    key={w.id}
                    onClick={() => onStartDM(w)}
                    className="w-full flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg text-right text-muted-foreground hover:bg-muted"
                  >
                    <Plus className="w-3 h-3 shrink-0" /> <span className="truncate">{w.full_name}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}