import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList, FolderKanban, CheckCircle2, Clock, Search, Eye, UserCog, KeyRound, User } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskDetailDialog from "@/components/tasks/TaskDetailDialog";
import WorkerProfileDialog from "@/components/worker-dashboard/WorkerProfileDialog";
import ChangePasswordDialog from "@/components/worker-dashboard/ChangePasswordDialog";

const ACCEPTANCE_COLORS = {
  "قيد الانتظار": "bg-amber-100 text-amber-700",
  "مقبولة": "bg-emerald-100 text-emerald-700",
  "مرفوضة": "bg-red-100 text-red-700",
};

const STATUS_OPTIONS = ["جديدة", "قيد التنفيذ", "مكتملة", "ملغاة"];

const STATUS_COLORS = {
  "جديدة": "bg-blue-100 text-blue-700",
  "قيد التنفيذ": "bg-amber-100 text-amber-700",
  "مكتملة": "bg-emerald-100 text-emerald-700",
  "ملغاة": "bg-red-100 text-red-700",
};

export default function WorkerDashboard() {
  const [worker, setWorker] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const workers = await base44.entities.RemoteWorker.filter({ email: user.email });
      if (workers.length === 0) {
        setLoading(false);
        return;
      }
      const w = workers[0];
      setWorker(w);
      const workerTasks = await base44.entities.Task.filter({ worker_id: w.id }, "-created_date");
      setTasks(workerTasks);
      const projectIds = [...new Set(workerTasks.map((t) => t.project_id).filter(Boolean))];
      if (projectIds.length > 0) {
        const allProjects = await base44.entities.Project.list();
        setProjects(allProjects.filter((p) => projectIds.includes(p.id)));
      }
      const taskParam = new URLSearchParams(window.location.search).get("task");
      if (taskParam) {
        const found = workerTasks.find((t) => t.id === taskParam);
        if (found) {
          setSelectedTask(found);
          setDetailOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    setSelectedTask(updatedTask);
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div>
        <PageHeader title="لوحة التحكم" description="مهامك ومشاريعك" />
        <EmptyState title="لا يوجد ملف موظف" description="لم يتم العثور على بيانات موظف مرتبطة ببريدك الإلكتروني" />
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.status === "مكتملة").length;
  const inProgressCount = tasks.filter((t) => t.status === "قيد التنفيذ").length;

  const handleStatusChange = async (taskId, newStatus) => {
    await base44.entities.Task.update(taskId, { status: newStatus });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    await base44.entities.TaskActivity.create({
      task_id: taskId,
      action: "status_changed",
      description: `تغيرت الحالة إلى "${newStatus}"`,
      actor_name: worker?.full_name || "",
    });
  };

  const filteredTasks = tasks.filter((t) =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title={`مرحباً، ${worker.full_name}`} description="نظرة عامة على مهامك ومشاريعك">
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center border shrink-0">
          {worker.profile_photo_url ? (
            <img src={worker.profile_photo_url} alt={worker.full_name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setProfileOpen(true)}>
          <UserCog className="w-4 h-4" /> تعديل الملف الشخصي
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPasswordOpen(true)}>
          <KeyRound className="w-4 h-4" /> تغيير كلمة المرور
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard title="إجمالي المهام" value={tasks.length} icon={ClipboardList} color="primary" />
        <StatCard title="قيد التنفيذ" value={inProgressCount} icon={Clock} color="amber" />
        <StatCard title="مهام مكتملة" value={completedCount} icon={CheckCircle2} color="green" />
      </div>

      <div className="bg-card rounded-2xl border p-6 mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-primary" />
          مشاريعي
        </h3>
        {projects.length === 0 ? (
          <EmptyState title="لا توجد مشاريع" description="لم يتم إسناد أي مشروع لك بعد" icon={FolderKanban} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-muted/50">
                <p className="font-semibold text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            مهامي
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مهمة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>
        {tasks.length === 0 ? (
          <EmptyState title="لا توجد مهام" description="لم يتم إسناد أي مهمة لك بعد" icon={ClipboardList} />
        ) : filteredTasks.length === 0 ? (
          <EmptyState title="لا نتائج" description="لا توجد مهام مطابقة لبحثك" icon={Search} />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{task.title}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ACCEPTANCE_COLORS[task.acceptance_status || "قيد الانتظار"]}`}>
                      {task.acceptance_status || "قيد الانتظار"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.due_date || "بدون تاريخ"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenTask(task)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Select value={task.status} onValueChange={(val) => handleStatusChange(task.id, val)}>
                    <SelectTrigger className={`w-40 h-8 text-xs border-0 font-medium ${STATUS_COLORS[task.status] || "bg-gray-100 text-gray-700"}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskDetailDialog open={detailOpen} onOpenChange={setDetailOpen} task={selectedTask} worker={worker} onUpdated={handleTaskUpdated} />
      <WorkerProfileDialog open={profileOpen} onOpenChange={setProfileOpen} worker={worker} onUpdated={setWorker} />
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  );
}