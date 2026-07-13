import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import FormDialog from "@/components/shared/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function ChangePasswordDialog({ open, onOpenChange }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمتا المرور الجديدتان غير متطابقتين", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.auth.changePassword({ userId: user.id, currentPassword, newPassword });
      toast({ title: "تم بنجاح", description: "تم تغيير كلمة المرور بنجاح" });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "خطأ", description: err.message || "فشل تغيير كلمة المرور", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }} title="تغيير كلمة المرور">
      <div className="space-y-4">
        <div>
          <Label>كلمة المرور الحالية</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <Label>كلمة المرور الجديدة</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <Label>تأكيد كلمة المرور الجديدة</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button onClick={handleSubmit} disabled={loading || !currentPassword || !newPassword} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تحديث كلمة المرور"}
        </Button>
      </div>
    </FormDialog>
  );
}