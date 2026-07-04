import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link2, Plus, X } from "lucide-react";

export default function CompanyLinksField({ links = [], onChange }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const handleAdd = () => {
    if (!url) return;
    onChange([...links, { title: title || url, url }]);
    setTitle("");
    setUrl("");
  };

  const handleRemove = (idx) => {
    onChange(links.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <Label>الروابط</Label>
      <div className="space-y-1.5 mt-1">
        {links.map((link, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-3 py-2">
            <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline truncate">
              <Link2 className="w-3.5 h-3.5 shrink-0" /> {link.title || link.url}
            </a>
            <button type="button" onClick={() => handleRemove(idx)} className="text-muted-foreground hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Input placeholder="عنوان الرابط" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
        <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" />
        <Button type="button" size="icon" variant="outline" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}