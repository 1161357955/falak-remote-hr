import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import FormDialog from "@/components/shared/FormDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import ProfilePhotoUpload from "./ProfilePhotoUpload";
import WorkerPersonalFields from "./WorkerPersonalFields";
import WorkerBankFields from "./WorkerBankFields";
import TagListInput from "./TagListInput";
import WorkerCertificatesField from "./WorkerCertificatesField";

export default function WorkerProfileDialog({ open, onOpenChange, worker, onUpdated }) {
  const [form, setForm] = useState(worker || {});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { setForm(worker || {}); }, [worker]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.RemoteWorker.update(worker.id, {
        national_id: form.national_id,
        gender: form.gender,
        city: form.city,
        region: form.region,
        phone: form.phone,
        email: form.email,
        bank_name: form.bank_name,
        bank_account_number: form.bank_account_number,
        iban: form.iban,
        skills: form.skills || [],
        qualifications: form.qualifications || [],
        certificates: form.certificates || [],
        profile_photo_url: form.profile_photo_url,
      });
      onUpdated({ ...worker, ...updated });
      toast({ title: "تم الحفظ", description: "تم تحديث بياناتك الشخصية بنجاح" });
      onOpenChange(false);
    } catch (err) {
      toast({ title: "خطأ", description: err.message || "فشل حفظ البيانات", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="تعديل الملف الشخصي">
      <div className="space-y-5">
        <ProfilePhotoUpload photoUrl={form.profile_photo_url} onChange={(url) => setForm({ ...form, profile_photo_url: url })} />
        <Tabs defaultValue="personal">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="personal">شخصي</TabsTrigger>
            <TabsTrigger value="bank">بنكية</TabsTrigger>
            <TabsTrigger value="skills">المهارات</TabsTrigger>
            <TabsTrigger value="certs">الشهادات</TabsTrigger>
          </TabsList>
          <TabsContent value="personal" className="pt-4">
            <WorkerPersonalFields form={form} onChange={setForm} />
          </TabsContent>
          <TabsContent value="bank" className="pt-4">
            <WorkerBankFields form={form} onChange={setForm} />
          </TabsContent>
          <TabsContent value="skills" className="pt-4 space-y-5">
            <TagListInput label="المهارات والتخصصات" items={form.skills || []} placeholder="أضف مهارة..." onChange={(v) => setForm({ ...form, skills: v })} />
            <TagListInput label="المؤهلات العلمية" items={form.qualifications || []} placeholder="أضف مؤهلاً علمياً..." onChange={(v) => setForm({ ...form, qualifications: v })} />
          </TabsContent>
          <TabsContent value="certs" className="pt-4">
            <WorkerCertificatesField certificates={form.certificates || []} onChange={(v) => setForm({ ...form, certificates: v })} />
          </TabsContent>
        </Tabs>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التغييرات"}
        </Button>
      </div>
    </FormDialog>
  );
}