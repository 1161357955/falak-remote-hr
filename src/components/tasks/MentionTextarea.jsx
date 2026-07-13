import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function MentionTextarea({ value, onChange, workers = [], placeholder, rows = 2, className = "" }) {
  const [showList, setShowList] = useState(false);
  const [query, setQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(null);

  const handleChange = (e) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(text);

    const beforeCursor = text.slice(0, cursor);
    const match = beforeCursor.match(/@([^\s@]*)$/);
    if (match) {
      setQuery(match[1]);
      setMentionStart(cursor - match[1].length - 1);
      setShowList(true);
    } else {
      setShowList(false);
    }
  };

  const handleSelect = (worker) => {
    if (mentionStart === null) return;
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + query.length);
    onChange(`${before}@${worker.full_name} ${after}`);
    setShowList(false);
    setQuery("");
    setMentionStart(null);
  };

  const filtered = workers.filter((w) => w.full_name?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative">
      <Textarea placeholder={placeholder} value={value} onChange={handleChange} rows={rows} className={className} />
      {showList && filtered.length > 0 && (
        <div className="absolute z-50 bottom-full mb-1 right-0 w-56 max-h-48 overflow-y-auto bg-card border rounded-lg shadow-lg">
          {filtered.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => handleSelect(w)}
              className="w-full text-right px-3 py-2 text-sm hover:bg-accent flex flex-col"
            >
              <span className="font-medium">{w.full_name}</span>
              <span className="text-xs text-muted-foreground">{w.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}