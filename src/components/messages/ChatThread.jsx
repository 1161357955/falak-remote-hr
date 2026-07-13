import React, { useState, useRef, useEffect } from "react";
import { Hash, MessageCircle, Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

export default function ChatThread({ channel, messages, currentUser, dmLabel, onSend }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() && !file) return;
    setSending(true);
    let file_url = "";
    if (file) {
      const res = await base44.integrations.Core.UploadFile({ file });
      file_url = res.file_url;
    }
    await onSend({ content: text.trim(), file_url });
    setText("");
    setFile(null);
    setSending(false);
  };

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card border rounded-2xl text-muted-foreground text-sm">
        اختر قناة أو محادثة لبدء الدردشة
      </div>
    );
  }

  return (
    <div className="flex-1 bg-card border rounded-2xl flex flex-col max-h-[75vh]">
      <div className="p-4 border-b flex items-center gap-2">
        {channel.type === "قناة عامة" ? <Hash className="w-4 h-4 text-primary" /> : <MessageCircle className="w-4 h-4 text-primary" />}
        <h3 className="font-bold text-sm">{channel.type === "قناة عامة" ? channel.name : dmLabel}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">لا توجد رسائل بعد، ابدأ المحادثة الآن</p>
        ) : (
          messages.map((m) => {
            const isMe = m.author_email === currentUser?.email;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {!isMe && <p className="text-[11px] font-bold mb-0.5 opacity-70">{m.author_name}</p>}
                  {m.content && <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                  {m.file_url && (
                    <a href={m.file_url} target="_blank" rel="noreferrer" className="text-xs underline block mt-1">
                      مرفق
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t space-y-2">
        {file && (
          <div className="flex items-center gap-2 text-xs bg-muted px-2 py-1 rounded-lg w-fit">
            {file.name}
            <X className="w-3 h-3 cursor-pointer" onClick={() => setFile(null)} />
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="cursor-pointer text-muted-foreground hover:text-foreground p-2">
            <Paperclip className="w-4 h-4" />
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="اكتب رسالة..."
            className="min-h-[40px] max-h-32 resize-none"
          />
          <Button size="icon" onClick={handleSend} disabled={sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}