import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

export default function TagListInput({ label, items = [], onChange, placeholder }) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const v = value.trim();
    if (!v) return;
    onChange([...items, v]);
    setValue("");
  };

  const handleRemove = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
        {items.map((item, idx) => (
          <span key={idx} className="flex items-center gap-1 text-xs bg-accent text-accent-foreground rounded-full px-3 py-1">
            {item}
            <button type="button" onClick={() => handleRemove(idx)} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground">لا توجد عناصر مضافة</p>}
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
        />
        <button type="button" onClick={handleAdd} className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border hover:bg-accent">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}