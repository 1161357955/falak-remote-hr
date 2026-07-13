import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { User, Loader2, Camera } from "lucide-react";

export default function ProfilePhotoUpload({ photoUrl, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-muted overflow-hidden flex items-center justify-center border shrink-0">
        {photoUrl ? (
          <img src={photoUrl} alt="الصورة الشخصية" className="w-full h-full object-cover" />
        ) : (
          <User className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:bg-accent border rounded-lg px-3 py-2 w-fit">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        تغيير الصورة
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}