import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Paperclip, Loader2, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import CommentItem from "@/components/tasks/CommentItem";

export default function TaskCommentsThread({ task }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.entities.TaskComment.filter({ task_id: task.id }, "created_date").then(setComments);
    base44.auth.me().then(setUser);
  }, [task.id]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!content.trim() && !fileUrl && !linkUrl) return;
    setSending(true);
    try {
      await base44.entities.TaskComment.create({
        task_id: task.id,
        author_name: user?.full_name || "مستخدم",
        author_email: user?.email || "",
        content,
        file_url: fileUrl,
        link_url: linkUrl,
        reactions: [],
      });
      setContent("");
      setFileUrl("");
      setLinkUrl("");
      setShowLinkInput(false);
      const updated = await base44.entities.TaskComment.filter({ task_id: task.id }, "created_date");
      setComments(updated);
    } finally {
      setSending(false);
    }
  };

  const handleToggleReaction = async (comment, emoji) => {
    const email = user?.email || "";
    const existing = comment.reactions || [];
    const already = existing.some((r) => r.emoji === emoji && r.author_email === email);
    const newReactions = already
      ? existing.filter((r) => !(r.emoji === emoji && r.author_email === email))
      : [...existing, { emoji, author_email: email }];
    await base44.entities.TaskComment.update(comment.id, { reactions: newReactions });
    setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, reactions: newReactions } : c)));
  };

  return (
    <div className="border-t bg-muted/20 rounded-b-2xl p-4 space-y-3">
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد تعليقات بعد</p>
        ) : (
          comments.map((c) => (
            <CommentItem key={c.id} comment={c} currentUserEmail={user?.email} onToggleReaction={handleToggleReaction} />
          ))
        )}
      </div>
      <div className="space-y-2">
        <Textarea placeholder="اكتب تعليقاً..." value={content} onChange={(e) => setContent(e.target.value)} rows={2} className="bg-background" />
        {showLinkInput && (
          <div className="flex items-center gap-2">
            <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="text-sm bg-background" />
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => { setLinkUrl(""); setShowLinkInput(false); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              {fileUrl ? "تم إرفاق ملف" : "إرفاق ملف"}
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowLinkInput((v) => !v)}>
              <Link2 className="w-4 h-4" /> إرفاق رابط
            </button>
          </div>
          <Button size="sm" onClick={handleSend} disabled={sending} className="gap-1">
            <Send className="w-3.5 h-3.5" /> إرسال
          </Button>
        </div>
      </div>
    </div>
  );
}