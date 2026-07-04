import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function CompanyTasksTab({ companyId }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, w] = await Promise.all([
        base44.entities.Project.filter({ company_id: companyId }),
        base44.entities.RemoteWorker.filter({ company_id: companyId }),
      ]);
      setProjects(p);
      setWorkers(w);
      const projectIds = p.map((pr) => pr.id);
      const allTasks = await base44.entities.Task.list("-created_date");
      setTasks(allTasks.filter((t) => projectIds.includes(t.project_id)));
    } finally { setLoading(false); }
  };

  const getName = (list, id, key) => list.find((i) => i.id === id)?.[key] || "—";

  const statusColor = {
    "جديدة": "bg-blue-100 text-blue-700",
    "قيد التنفيذ": "bg-amber-100 text-amber-700",
    "مكتملة": "bg-emerald-100 text-emerald-700",
    "ملغاة": "bg-red-100 text-red-700",
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  if (tasks.length === 0) {
    return <EmptyState icon={ClipboardList} title="لا توجد مهام" description="لا توجد مهام مرتبطة بمشاريع هذه المنشأة بعد" />;
  }

  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right p-4 font-medium">المهمة</th>
              <th className="text-right p-4 font-medium">المشروع</th>
              <th className="text-right p-4 font-medium">الموظف</th>
              <th className="text-right p-4 font-medium">الأولوية</th>
              <th className="text-right p-4 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium">{t.title}</td>
                <td className="p-4 text-muted-foreground">{getName(projects, t.project_id, "title")}</td>
                <td className="p-4 text-muted-foreground">{getName(workers, t.worker_id, "full_name")}</td>
                <td className="p-4 text-muted-foreground">{t.priority}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[t.status] || ""}`}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}