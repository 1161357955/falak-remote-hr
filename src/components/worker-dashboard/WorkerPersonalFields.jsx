import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WorkerPersonalFields({ form, onChange }) {
  const set = (field, value) => onChange({ ...form, [field]: value });

  return (
    <div className="space-y-4">
      <div><Label>رقم الهوية</Label><Input value={form.national_id || ""} onChange={(e) => set("national_id", e.target.value)} /></div>
      <div>
        <Label>الجنس</Label>
        <Select value={form.gender || ""} onValueChange={(v) => set("gender", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ذكر">ذكر</SelectItem>
            <SelectItem value="أنثى">أنثى</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>المدينة</Label><Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></div>
        <div><Label>المنطقة</Label><Input value={form.region || ""} onChange={(e) => set("region", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>رقم الجوال</Label><Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></div>
        <div><Label>البريد الإلكتروني</Label><Input value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></div>
      </div>
    </div>
  );
}