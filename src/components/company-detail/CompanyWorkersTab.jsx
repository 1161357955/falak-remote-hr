import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Pencil, Trash2, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import EmptyState from "@/components/shared/EmptyState";
import FormDialog from "@/components/shared/FormDialog";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = {
  full_name: "", national_id: "", gender: "ذكر", is_disabled: false,
  phone: "", email: "", city: "", region: "", job_title: "",
  work_type: "دوام كامل", salary: "", status: "نشط",
  contract_start: "", contract_end: "", agreed_work_days: 5, annual_leave_days: 21,
};

export default function CompanyWorkersTab({ companyId }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const w = await base44.entities.RemoteWorker.filter({ company_id: companyId }, "-created_date");
      setWorkers(w);
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.full_name || !form.national_id) {
      toast({ title: "خطأ", description: "الاسم ورقم الهوية مطلوبان", variant: "destructive" });
      return;
    }
    const data = { ...form, company_id: companyId, salary: form.salary ? Number(form.salary) : undefined };
    if (editId) await base44.entities.RemoteWorker.update(editId, data);
    else await base44.entities.RemoteWorker.create(data);
    setDialogOpen(false);
    setForm(emptyForm);
    setEditId(null);
    loadData();
    toast({ title: editId ? "تم التحديث" : "تمت الإضافة" });
  };

  const handleEdit = (w) => {
    setForm({ ...emptyForm, ...w, salary: w.salary || "" });
    setEditId(w.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.RemoteWorker.delete(id);
      toast({ title: "تم الحذف" });
    } catch {
      toast({ title: "الموظف غير موجود بالفعل", variant: "destructive" });
    }
    loadData();
  };

  const statusColor = {
    "نشط": "bg-emerald-100 text-emerald-700",
    "معلق": "bg-amber-100 text-amber-700",
    "منتهي": "bg-red-100 text-red-700",
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> إضافة موظف
        </Button>
      </div>

      {workers.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد موظفون" description="ابدأ بإضافة موظف لهذه المنشأة" />
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-4 font-medium">الاسم</th>
                  <th className="text-right p-4 font-medium">رقم الهوية</th>
                  <th className="text-right p-4 font-medium">المسمى</th>
                  <th className="text-right p-4 font-medium">الحالة</th>
                  <th className="text-right p-4 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {workers.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2">
                        {w.full_name}
                        {w.is_disabled && <Accessibility className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{w.national_id}</td>
                    <td className="p-4 text-muted-foreground">{w.job_title || "—"}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[w.status] || ""}`}>{w.status}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(w)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(w.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editId ? "تعديل موظف" : "إضافة موظف"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>رقم الهوية *</Label><Input value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الجنس</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ذكر">ذكر</SelectItem><SelectItem value="أنثى">أنثى</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.is_disabled} onCheckedChange={(v) => setForm({ ...form, is_disabled: v })} />
              <Label>من ذوي الإعاقة</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>المسمى الوظيفي</Label><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
            <div>
              <Label>نوع الدوام</Label>
              <Select value={form.work_type} onValueChange={(v) => setForm({ ...form, work_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="دوام كامل">دوام كامل</SelectItem><SelectItem value="دوام جزئي">دوام جزئي</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>الجوال</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>الراتب</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
          </div>
          <div><Label>البريد الإلكتروني</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>بداية العقد</Label><Input type="date" value={form.contract_start} onChange={(e) => setForm({ ...form, contract_start: e.target.value })} /></div>
            <div><Label>نهاية العقد</Label><Input type="date" value={form.contract_end} onChange={(e) => setForm({ ...form, contract_end: e.target.value })} /></div>
          </div>
          <div>
            <Label>الحالة</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["نشط", "معلق", "منتهي"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} className="w-full">{editId ? "تحديث" : "إضافة"}</Button>
        </div>
      </FormDialog>
    </div>
  );
}