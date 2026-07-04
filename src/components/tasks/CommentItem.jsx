import React from "react";
import { Paperclip } from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "👀"];

export default function CommentItem({ comment, currentUserEmail, onToggleReaction }) {
  const grouped = {};
  (comment.reactions || []).forEach((r) => {
    grouped[r.emoji] = grouped[r.emoji] || [];
    grouped[r.emoji].push(r.author_email);
  });

  return (
    <div className="bg-muted/40 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold">{comment.author_name || "مستخدم"}</span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(comment.created_date).toLocaleString("ar-SA")}
        </span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      {comment.file_url && (
        <a href={comment.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <Paperclip className="w-3 h-3" /> مرفق
        </a>
      )}
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {EMOJIS.map((emoji) => {
          const authors = grouped[emoji] || [];
          const active = authors.includes(currentUserEmail);
          return (
            <button
              key={emoji}
              onClick={() => onToggleReaction(comment, emoji)}
              className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${active ? "bg-primary/10 border-primary" : "border-transparent hover:bg-accent"}`}
            >
              <span>{emoji}</span>
              {authors.length > 0 && <span className="text-[10px]">{authors.length}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}