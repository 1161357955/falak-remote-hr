import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, Plus, Search, Clock, Target, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import FormDialog from "@/components/shared/FormDialog";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const emptyForm = {
  worker_id: "", date: "", login_time: "", logout_time: "",
  hours_worked: 0, tasks_assigned: 0, tasks_completed: 0,
  activity_level: "جيد", notes: "",
};

export default function Reports() {
  const [logs, setLogs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterWorker, setFilterWorker] = useState("الكل");
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [l, w] = await Promise.all([
        base44.entities.PerformanceLog.list("-date", 50),
        base44.entities.RemoteWorker.list(),
      ]);
      setLogs(l);
      setWorkers(w);
    } finally { setLoading(false); }
  };

  const getWorkerName = (id) => workers.find((w) => w.id === id)?.full_name || "—";

  const handleSave = async () => {
    if (!form.worker_id || !form.date) {
      toast({ title: "خطأ", description: "الموظف والتاريخ مطلوبان", variant: "destructive" });
      return;
    }
    const data = {
      ...form,
      hours_worked: Number(form.hours_worked),
      tasks_assigned: Number(form.tasks_assigned),
      tasks_completed: Number(form.tasks_completed),
    };
    await base44.entities.PerformanceLog.create(data);
    setDialogOpen(false);
    setForm(emptyForm);
    loadData();
    toast({ title: "تمت إضافة السجل" });
  };

  const filtered = filterWorker === "الكل" ? logs : logs.filter((l) => l.worker_id === filterWorker);

  const activityColor = {
    "ممتاز": "bg-emerald-100 text-emerald-700",
    "جيد جداً": "bg-blue-100 text-blue-700",
    "جيد": "bg-cyan-100 text-cyan-700",
    "مقبول": "bg-amber-100 text-amber-700",
    "ضعيف": "bg-red-100 text-red-700",
  };

  const totalHours = filtered.reduce((s, l) => s + (l.hours_worked || 0), 0);
  const totalAssigned = filtered.reduce((s, l) => s + (l.tasks_assigned || 0), 0);
  const totalCompleted = filtered.reduce((s, l) => s + (l.tasks_completed || 0), 0);

  const chartData = filtered.slice(0, 10).reverse().map((l) => ({
    date: l.date,
    ساعات: l.hours_worked || 0,
    مهام_منجزة: l.tasks_completed || 0,
  }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="تقارير الأداء" description="متابعة أداء العاملين عن بُعد وفق معايير وزارة الموارد البشرية">
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> إضافة سجل
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filterWorker} onValueChange={setFilterWorker}>
          <SelectTrigger className="w-48"><SelectValue placeholder="تصفية حسب الموظف" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل">جميع الموظفين</SelectItem>
            {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">إجمالي ساعات العمل</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <Target className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalAssigned}</p>
            <p className="text-xs text-muted-foreground">المهام الموكلة</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Activity className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground">المهام المنجزة</p>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-card border rounded-2xl p-6 mb-8">
          <h3 className="font-bold mb-4">ساعات العمل والمهام المنجزة</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="ساعات" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="مهام_منجزة" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={BarChart3} title="لا توجد سجلات أداء" description="ابدأ بإضافة سجلات أداء للموظفين" />
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-4 font-medium">الموظف</th>
                  <th className="text-right p-4 font-medium">التاريخ</th>
                  <th className="text-right p-4 font-medium">الدخول</th>
                  <th className="text-right p-4 font-medium">الخروج</th>
                  <th className="text-right p-4 font-medium">الساعات</th>
                  <th className="text-right p-4 font-medium">موكلة</th>
                  <th className="text-right p-4 font-medium">منجزة</th>
                  <th className="text-right p-4 font-medium">النشاط</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{getWorkerName(l.worker_id)}</td>
                    <td className="p-4 text-muted-foreground">{l.date}</td>
                    <td className="p-4 text-muted-foreground">{l.login_time || "—"}</td>
                    <td className="p-4 text-muted-foreground">{l.logout_time || "—"}</td>
                    <td className="p-4">{l.hours_worked || 0}</td>
                    <td className="p-4">{l.tasks_assigned || 0}</td>
                    <td className="p-4">{l.tasks_completed || 0}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${activityColor[l.activity_level] || ""}`}>
                        {l.activity_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="إضافة سجل أداء">
        <div className="space-y-4">
          <div>
            <Label>الموظف *</Label>
            <Select value={form.worker_id} onValueChange={(v) => setForm({ ...form, worker_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
              <SelectContent>{workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>التاريخ *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>وقت الدخول</Label><Input type="time" value={form.login_time} onChange={(e) => setForm({ ...form, login_time: e.target.value })} /></div>
            <div><Label>وقت الخروج</Label><Input type="time" value={form.logout_time} onChange={(e) => setForm({ ...form, logout_time: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>ساعات العمل</Label><Input type="number" value={form.hours_worked} onChange={(e) => setForm({ ...form, hours_worked: e.target.value })} /></div>
            <div><Label>مهام موكلة</Label><Input type="number" value={form.tasks_assigned} onChange={(e) => setForm({ ...form, tasks_assigned: e.target.value })} /></div>
            <div><Label>مهام منجزة</Label><Input type="number" value={form.tasks_completed} onChange={(e) => setForm({ ...form, tasks_completed: e.target.value })} /></div>
          </div>
          <div>
            <Label>مستوى النشاط</Label>
            <Select value={form.activity_level} onValueChange={(v) => setForm({ ...form, activity_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <Button onClick={handleSave} className="w-full">إضافة</Button>
        </div>
      </FormDialog>
    </div>
  );
}