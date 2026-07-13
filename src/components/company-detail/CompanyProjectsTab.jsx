import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FolderKanban, Plus, Pencil, Trash2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";
import FormDialog from "@/components/shared/FormDialog";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = ["برنامج الإدارة الرشيدة", "أنظمة البرمجيات كخدمة", "المشاريع الرقمية", "عام"];

const emptyForm = {
  title: "", description: "", category: "عام", status: "جديد",
  start_date: "", end_date: "", budget: "", progress: 0,
};

export default function CompanyProjectsTab({ companyId, isAdmin }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await base44.entities.Project.filter({ company_id: companyId }, "-created_date");
      setProjects(p);
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.title) {
      toast({ title: "خطأ", description: "اسم المشروع مطلوب", variant: "destructive" });
      return;
    }
    const data = { ...form, company_id: companyId, budget: form.budget ? Number(form.budget) : undefined, progress: Number(form.progress) || 0 };
    if (editId) await base44.entities.Project.update(editId, data);
    else await base44.entities.Project.create(data);
    setDialogOpen(false);
    setForm(emptyForm);
    setEditId(null);
    loadData();
    toast({ title: editId ? "تم التحديث" : "تمت الإضافة" });
  };

  const handleEdit = (p) => {
    setForm({ ...emptyForm, ...p, budget: p.budget || "" });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Project.delete(id);
      toast({ title: "تم الحذف" });
    } catch {
      toast({ title: "المشروع غير موجود بالفعل", variant: "destructive" });
    }
    loadData();
  };

  const statusColor = {
    "جديد": "bg-blue-100 text-blue-700",
    "قيد التنفيذ": "bg-amber-100 text-amber-700",
    "مكتمل": "bg-emerald-100 text-emerald-700",
    "متوقف": "bg-red-100 text-red-700",
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        {isAdmin && (
          <Link to={`/projects?company=${companyId}`}>
            <Button variant="outline" className="gap-2">
              <FolderKanban className="w-4 h-4" /> فتح في لوحة المشاريع
            </Button>
          </Link>
        )}
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> إضافة مشروع
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="لا توجد مشاريع" description="ابدأ بإنشاء مشروع لهذه المنشأة" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-card border rounded-2xl p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-sm">{p.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[p.status] || ""}`}>{p.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{p.category}</p>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                <div className="h-full bg-primary" style={{ width: `${p.progress || 0}%` }} />
              </div>
              <div className="flex items-center gap-2 border-t pt-3">
                {isAdmin && (
                  <Link to={`/tasks?project=${p.id}`}>
                    <Button variant="ghost" size="sm"><ClipboardList className="w-3.5 h-3.5 ml-1" /> المهام</Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Pencil className="w-3.5 h-3.5 ml-1" /> تعديل</Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5 ml-1" /> حذف</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editId ? "تعديل مشروع" : "إضافة مشروع"}>
        <div className="space-y-4">
          <div><Label>اسم المشروع *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الفئة</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["جديد", "قيد التنفيذ", "مكتمل", "متوقف"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>تاريخ البداية</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>تاريخ النهاية</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>الميزانية</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
            <div><Label>نسبة الإنجاز %</Label><Input type="number" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} /></div>
          </div>
          <Button onClick={handleSave} className="w-full">{editId ? "تحديث" : "إضافة"}</Button>
        </div>
      </FormDialog>
    </div>
  );
}