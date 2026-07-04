import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Plus, Pencil, Trash2, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import FormDialog from "@/components/shared/FormDialog";
import TaskCommentsDialog from "@/components/tasks/TaskCommentsDialog";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = {
  title: "", description: "", project_id: "", worker_id: "",
  status: "جديدة", priority: "متوسطة", due_date: "", estimated_hours: "", actual_hours: 0,
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
  const [commentsTask, setCommentsTask] = useState(null);
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
    const data = { ...form, estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : undefined, actual_hours: Number(form.actual_hours) };
    if (editId) await base44.entities.Task.update(editId, data);
    else await base44.entities.Task.create(data);
    setDialogOpen(false);
    setForm(emptyForm);
    setEditId(null);
    loadData();
    toast({ title: editId ? "تم التحديث" : "تمت الإضافة" });
  };

  const handleEdit = (t) => {
    setForm({ ...emptyForm, ...t, estimated_hours: t.estimated_hours || "" });
    setEditId(t.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.Task.delete(id);
    loadData();
    toast({ title: "تم الحذف" });
  };

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title?.includes(search);
    const matchStatus = filterStatus === "الكل" || t.status === filterStatus;
    return matchSearch && matchStatus;
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
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="لا توجد مهام" description="ابدأ بإضافة مهمة جديدة" />
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-card border rounded-2xl p-5 hover:shadow-sm transition-shadow flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-sm">{t.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[t.priority] || ""}`}>{t.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[t.status] || ""}`}>{t.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>المشروع: {getName(projects, t.project_id)}</span>
                  {t.worker_id && <span>المسؤول: {getName(workers, t.worker_id)}</span>}
                  {t.due_date && <span>التسليم: {t.due_date}</span>}
                  {t.estimated_hours > 0 && <span>{t.actual_hours || 0}/{t.estimated_hours} ساعة</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setCommentsTask(t)}><MessageSquare className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editId ? "تعديل مهمة" : "إضافة مهمة"}>
        <div className="space-y-4">
          <div><Label>عنوان المهمة *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
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
          <div className="grid grid-cols-2 gap-4">
            <div><Label>تاريخ التسليم</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><Label>الساعات المقدرة</Label><Input type="number" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} /></div>
          </div>
          <Button onClick={handleSave} className="w-full">{editId ? "تحديث" : "إضافة"}</Button>
        </div>
      </FormDialog>

      <TaskCommentsDialog open={!!commentsTask} onOpenChange={(v) => !v && setCommentsTask(null)} task={commentsTask} />
    </div>
  );
}