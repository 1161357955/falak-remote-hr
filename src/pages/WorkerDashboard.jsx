import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList, FolderKanban, CheckCircle2, Clock } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  return (
    <div>
      <PageHeader title={`مرحباً، ${worker.full_name}`} description="نظرة عامة على مهامك ومشاريعك" />

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
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          مهامي
        </h3>
        {tasks.length === 0 ? (
          <EmptyState title="لا توجد مهام" description="لم يتم إسناد أي مهمة لك بعد" icon={ClipboardList} />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.due_date || "بدون تاريخ"}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[task.status] || "bg-gray-100 text-gray-700"}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}