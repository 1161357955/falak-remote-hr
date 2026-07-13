import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FolderKanban, Plus, Pencil, Trash2, Search, Calendar, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import FormDialog from "@/components/shared/FormDialog";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = {
  title: "", description: "", company_id: "", category: "عام", status: "جديد",
  start_date: "", end_date: "", budget: "", progress: 0,
};

const PROJECT_CATEGORIES = ["برنامج الإدارة الرشيدة", "أنظمة البرمجيات كخدمة", "المشاريع الرقمية", "عام"];

const GOVERNANCE_TASKS = [
  "حجز الاسم التجاري",
  "إصدار السجل التجاري",
  "فتح ملف المنشأة في وزارة الموارد البشرية والتنمية الاجتماعية",
  "تسجيل المنشأة في التأمينات الاجتماعية",
  "استئجار موقع للمنشأة",
  "استخراج موافقة الدفاع المدني",
  "استخراج رخصة البلدية",
  "استخراج التأشيرات",
  "تصميم العلامة التجارية",
  "إطلاق الحملة التسويقية",
  "إطلاق المنشأة",
  "التوسع في العمل",
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState(() => new URLSearchParams(window.location.search).get("company") || "الكل");
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [p, c] = await Promise.all([
        base44.entities.Project.list("-created_date"),
        base44.entities.Company.list(),
      ]);
      setProjects(p);
      setCompanies(c);
    } finally { setLoading(false); }
  };

  const getCompanyName = (id) => companies.find((c) => c.id === id)?.name || "—";

  const handleSave = async () => {
    if (!form.title || !form.company_id) {
      toast({ title: "خطأ", description: "اسم المشروع والمنشأة مطلوبان", variant: "destructive" });
      return;
    }
    const data = { ...form, budget: form.budget ? Number(form.budget) : undefined, progress: Number(form.progress) };
    if (editId) {
      await base44.entities.Project.update(editId, data);
    } else {
      const newProject = await base44.entities.Project.create(data);
      if (data.category === "برنامج الإدارة الرشيدة") {
        await base44.entities.Task.bulkCreate(
          GOVERNANCE_TASKS.map((title) => ({ title, project_id: newProject.id, status: "جديدة" }))
        );
      }
    }
    setDialogOpen(false);
    setForm(emptyForm);
    setEditId(null);
    loadData();
    toast({ title: editId ? "تم التحديث" : "تمت الإضافة", description: !editId && data.category === "برنامج الإدارة الرشيدة" ? "تم إنشاء قائمة مهام برنامج الإدارة الرشيدة، يمكنك الآن إسنادها للموظفين" : undefined });
  };

  const handleEdit = (p) => {
    setForm({ ...emptyForm, ...p, budget: p.budget || "" });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.Project.delete(id);
    loadData();
    toast({ title: "تم الحذف" });
  };

  const filtered = projects.filter((p) => {
    const matchSearch = p.title?.includes(search);
    const matchCompany = filterCompany === "الكل" || p.company_id === filterCompany;
    return matchSearch && matchCompany;
  });

  const statusColor = {
    "جديد": "bg-blue-100 text-blue-700",
    "قيد التنفيذ": "bg-amber-100 text-amber-700",
    "مكتمل": "bg-emerald-100 text-emerald-700",
    "متوقف": "bg-red-100 text-red-700",
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="المشاريع" description="إدارة مشاريع العمل عن بُعد">
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> إنشاء مشروع
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-52"><SelectValue placeholder="المنشأة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل">كل المنشآت</SelectItem>
            {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="لا توجد مشاريع" description="ابدأ بإنشاء مشروع جديد" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-card border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold">{p.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[p.status] || ""}`}>{p.status}</span>
              </div>
              {p.category && p.category !== "عام" && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mb-2">{p.category}</span>
              )}
              {p.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>}
              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                <p>المنشأة: {getCompanyName(p.company_id)}</p>
                {p.start_date && (
                  <p className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.start_date} → {p.end_date || "—"}</p>
                )}
                {p.budget > 0 && <p>الميزانية: {Number(p.budget).toLocaleString()} ر.س</p>}
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>نسبة الإنجاز</span>
                  <span className="font-bold">{p.progress || 0}%</span>
                </div>
                <Progress value={p.progress || 0} className="h-2" />
              </div>
              <div className="flex items-center gap-2 border-t pt-3">
                <Link to={`/tasks?project=${p.id}`}>
                  <Button variant="ghost" size="sm"><ClipboardList className="w-3.5 h-3.5 ml-1" /> المهام</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Pencil className="w-3.5 h-3.5 ml-1" /> تعديل</Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5 ml-1" /> حذف</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editId ? "تعديل مشروع" : "إنشاء مشروع"}>
        <div className="space-y-4">
          <div><Label>اسم المشروع *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>المنشأة *</Label>
            <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر المنشأة" /></SelectTrigger>
              <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>قائمة المشروع</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROJECT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>الحالة</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["جديد", "قيد التنفيذ", "مكتمل", "متوقف"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>تاريخ البداية</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>تاريخ النهاية</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>الميزانية (ر.س)</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
            <div><Label>نسبة الإنجاز %</Label><Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} /></div>
          </div>
          <Button onClick={handleSave} className="w-full">{editId ? "تحديث" : "إنشاء"}</Button>
        </div>
      </FormDialog>
    </div>
  );
}