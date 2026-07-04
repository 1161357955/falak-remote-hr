import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2, FileText, X } from "lucide-react";

export default function CompanyDocumentsField({ documents = [], onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange([...documents, { name: file.name, url: file_url }]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = (idx) => {
    onChange(documents.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <Label>المستندات المرفقة</Label>
      <div className="space-y-1.5 mt-1">
        {documents.map((doc, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-3 py-2">
            <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline truncate">
              <FileText className="w-3.5 h-3.5 shrink-0" /> {doc.name || "مستند"}
            </a>
            <button type="button" onClick={() => handleRemove(idx)} className="text-muted-foreground hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground border rounded-md px-3 py-2 w-fit mt-2">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        إضافة مستند
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}