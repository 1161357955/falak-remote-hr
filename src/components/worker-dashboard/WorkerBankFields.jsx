import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WorkerBankFields({ form, onChange }) {
  const set = (field, value) => onChange({ ...form, [field]: value });

  return (
    <div className="space-y-4">
      <div><Label>اسم البنك</Label><Input value={form.bank_name || ""} onChange={(e) => set("bank_name", e.target.value)} /></div>
      <div><Label>رقم الحساب البنكي</Label><Input value={form.bank_account_number || ""} onChange={(e) => set("bank_account_number", e.target.value)} /></div>
      <div><Label>رقم الآيبان (IBAN)</Label><Input value={form.iban || ""} onChange={(e) => set("iban", e.target.value)} placeholder="SA00 0000 0000 0000 0000 0000" /></div>
    </div>
  );
}