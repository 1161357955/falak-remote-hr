import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Plus, Pencil, Trash2, Search, MessageSquare, ChevronDown, ChevronUp, Sparkles, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import FormDialog from "@/components/shared/FormDialog";
import HoursMinutesInput from "@/components/tasks/HoursMinutesInput";
import TaskCommentsThread from "@/components/tasks/TaskCommentsThread";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = {
  title: "", description: "", project_id: "", worker_id: "",
  status: "جديدة", priority: "متوسطة", due_date: "",
  estimated_h: "", estimated_m: "", actual_h: "", actual_m: "",
};

const RASHIDA_STAGES = [
  "حجز اسم تجاري",
  "إصدار السجل التجاري",
  "فتح ملف منشأة في وزارة الموارد البشرية والتنمية الاجتماعية",
  "تسجيل المنشأة في التأمينات الاجتماعية",
  "استئجار موقع",
  "استخراج موافقة الدفاع المدني",
  "استخراج رخصة البلدية",
  "استخراج التأشيرات",
  "تصميم العلامة التجارية",
  "الحملة التسويقية",
  "الإطلاق",
  "التوسع بالعمل",
];

const decimalToHM = (decimal) => {
  const total = Number(decimal) || 0;
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  return { h: h || "", m: m || "" };
};

const hmToDecimal = (h, m) => {
  const hours = Number(h) || 0;
  const minutes = Number(m) || 0;
  return hours + minutes / 60;
};

const formatHours = (decimal) => {
  const { h, m } = decimalToHM(decimal);
  if (!h && !m) return "0د";
  return `${h || 0}س ${m || 0}د`;
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterProject, setFilterProject] = useState(() => new URLSearchParams(window.location.search).get("project") || "الكل");
  const [filterCompany] = useState(() => new URLSearchParams(window.location.search).get("company") || null);
  const [expandedId, setExpandedId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [sortBy, setSortBy] = useState("due_date");
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [t, p, w] = await Promise.all([
        base44.entities.Task.list("-created_date"),
        base44.entities.Project.list(),
        base44.entities.RemoteWorker.list(),
      ]);
      setTasks(t);
      setProjects(p);
      setWorkers(w);
    } finally { setLoading(false); }
  };

  const getName = (list, id) => {
    const item = list.find((i) => i.id === id);
    return item?.title || item?.full_name || "—";
  };

  const handleSave = async () => {
    if (!form.title || !form.project_id) {
      toast({ title: "خطأ", description: "العنوان والمشروع مطلوبان", variant: "destructive" });
      return;
    }
    const { estimated_h, estimated_m, actual_h, actual_m, ...rest } = form;
    const data = {
      ...rest,
      estimated_hours: (estimated_h || estimated_m) ? hmToDecimal(estimated_h, estimated_m) : undefined,
      actual_hours: hmToDecimal(actual_h, actual_m),
    };
    if (editId) await base44.entities.Task.update(editId, data);
    else await base44.entities.Task.create(data);
    setDialogOpen(false);
    setForm(emptyForm);
    setEditId(null);
    loadData();
    toast({ title: editId ? "تم التحديث" : "تمت الإضافة" });
  };

  const handleEdit = (t) => {
    const est = decimalToHM(t.estimated_hours);
    const act = decimalToHM(t.actual_hours);
    setForm({
      ...emptyForm, ...t,
      estimated_h: est.h, estimated_m: est.m,
      actual_h: act.h, actual_m: act.m,
    });
    setEditId(t.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.Task.delete(id);
    loadData();
    toast({ title: "تم الحذف" });
  };

  const handleGenerateWithAI = async () => {
    if (!form.title) {
      toast({ title: "أدخل عنوان المهمة أولاً", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const project = projects.find((p) => p.id === form.project_id);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `اقترح تفاصيل مهمة عمل بعنوان "${form.title}"${project ? ` ضمن مشروع "${project.title}"` : ""}. أعطِ وصفاً واضحاً من 2-3 جمل، وأولوية مناسبة، وعدد ساعات مقدرة واقعية لإنجازها.`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            priority: { type: "string", enum: ["منخفضة", "متوسطة", "عالية", "عاجلة"] },
            estimated_hours: { type: "number" },
          },
        },
      });
      const est = decimalToHM(result.estimated_hours);
      setForm((f) => ({
        ...f,
        description: result.description || f.description,
        priority: result.priority || f.priority,
        estimated_h: est.h, estimated_m: est.m,
      }));
      toast({ title: "تم توليد تفاصيل المهمة بالذكاء الاصطناعي" });
    } finally {
      setGenerating(false);
    }
  };

  const priorityOrder = { "عاجلة": 0, "عالية": 1, "متوسطة": 2, "منخفضة": 3 };

  const filtered = tasks
    .filter((t) => {
      const matchSearch = t.title?.includes(search);
      const matchStatus = filterStatus === "الكل" || t.status === filterStatus;
      const matchProject = filterProject === "الكل" || t.project_id === filterProject;
      const matchCompany = !filterCompany || projects.find((p) => p.id === t.project_id)?.company_id === filterCompany;
      return matchSearch && matchStatus && matchProject && matchCompany;
    })
    .sort((a, b) => {
      if (sortBy === "due_date") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortBy === "priority") {
        return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      }
      if (sortBy === "created_date") {
        return new Date(b.created_date) - new Date(a.created_date);
      }
      return 0;
    });

  const statusColor = {
    "جديدة": "bg-blue-100 text-blue-700",
    "قيد التنفيذ": "bg-amber-100 text-amber-700",
    "مكتملة": "bg-emerald-100 text-emerald-700",
    "ملغاة": "bg-red-100 text-red-700",
  };

  const priorityColor = {
    "منخفضة": "bg-gray-100 text-gray-600",
    "متوسطة": "bg-blue-50 text-blue-600",
    "عالية": "bg-orange-100 text-orange-700",
    "عاجلة": "bg-red-100 text-red-700",
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="المهام" description="توزيع ومتابعة المهام">
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> إضافة مهمة
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل">الكل</SelectItem>
            {["جديدة", "قيد التنفيذ", "مكتملة", "ملغاة"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48"><SelectValue placeholder="المشروع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل">كل المشاريع</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="due_date">تاريخ التسليم</SelectItem>
            <SelectItem value="priority">الأولوية</SelectItem>
            <SelectItem value="created_date">تاريخ الإنشاء</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="لا توجد مهام" description="ابدأ بإضافة مهمة جديدة" />
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-card border rounded-2xl hover:shadow-sm transition-shadow">
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-sm">{t.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[t.priority] || ""}`}>{t.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[t.status] || ""}`}>{t.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <Link to={`/projects?company=${projects.find((p) => p.id === t.project_id)?.company_id || ""}`} className="flex items-center gap-1 hover:text-primary hover:underline">
                      <FolderKanban className="w-3 h-3" /> المشروع: {getName(projects, t.project_id)}
                    </Link>
                    {t.worker_id && <span>المسؤول: {getName(workers, t.worker_id)}</span>}
                    {t.due_date && <span>التسليم: {t.due_date}</span>}
                    {t.estimated_hours > 0 && <span>{formatHours(t.actual_hours)} / {formatHours(t.estimated_hours)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                    <MessageSquare className="w-4 h-4" />
                    {expandedId === t.id ? <ChevronUp className="w-3 h-3 -mr-1" /> : <ChevronDown className="w-3 h-3 -mr-1" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {expandedId === t.id && <TaskCommentsThread task={t} />}
            </div>
          ))}
        </div>
      )}

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editId ? "تعديل مهمة" : "إضافة مهمة"}>
        <div className="space-y-4">
          <div>
            <Label>عنوان المهمة *</Label>
            {projects.find((p) => p.id === form.project_id)?.category === "برنامج الإدارة الرشيدة" && (
              <Select value="" onValueChange={(v) => setForm({ ...form, title: v })}>
                <SelectTrigger className="mb-2"><SelectValue placeholder="اختر من مراحل الإدارة الرشيدة" /></SelectTrigger>
                <SelectContent>{RASHIDA_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onBlur={() => { if (!editId && form.title && !form.description) handleGenerateWithAI(); }}
              />
              <Button type="button" variant="outline" className="gap-1.5 shrink-0" onClick={handleGenerateWithAI} disabled={generating}>
                <Sparkles className="w-3.5 h-3.5" /> {generating ? "جارٍ التوليد..." : "توليد بالذكاء الاصطناعي"}
              </Button>
            </div>
            {generating && <p className="text-xs text-muted-foreground mt-1">جارٍ اقتراح تفاصيل المهمة بالذكاء الاصطناعي...</p>}
          </div>
          <div><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>المشروع *</Label>
            <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>الموظف المسؤول</Label>
            <Select value={form.worker_id} onValueChange={(v) => setForm({ ...form, worker_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
              <SelectContent>{workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["جديدة", "قيد التنفيذ", "مكتملة", "ملغاة"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>الأولوية</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["منخفضة", "متوسطة", "عالية", "عاجلة"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>تاريخ التسليم</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <HoursMinutesInput
              label="الساعات المقدرة"
              hours={form.estimated_h}
              minutes={form.estimated_m}
              onHoursChange={(v) => setForm({ ...form, estimated_h: v })}
              onMinutesChange={(v) => setForm({ ...form, estimated_m: v })}
            />
            <HoursMinutesInput
              label="الساعات الفعلية"
              hours={form.actual_h}
              minutes={form.actual_m}
              onHoursChange={(v) => setForm({ ...form, actual_h: v })}
              onMinutesChange={(v) => setForm({ ...form, actual_m: v })}
            />
          </div>
          <Button onClick={handleSave} className="w-full">{editId ? "تحديث" : "إضافة"}</Button>
        </div>
      </FormDialog>
    </div>
  );
}