import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, FolderKanban, ClipboardList, CheckCircle2 } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import ComplianceOverview from "@/components/dashboard/ComplianceOverview";

function computeCompliancePoints(workers, tasks, logs) {
  const total = workers.length || 1;
  const pct = (count) => (count / total) * 100;
  const filled = (key) => workers.filter((w) => w[key] !== undefined && w[key] !== null && w[key] !== "").length;
  const workerTasks = (id) => tasks.filter((t) => t.worker_id === id);
  const workerLogs = (id) => logs.filter((l) => l.worker_id === id);

  const totalAssigned = tasks.length;
  const totalCompleted = tasks.filter((t) => t.status === "مكتملة").length;
  const completionRate = totalAssigned ? (totalCompleted / totalAssigned) * 100 : 0;

  const goodActivityLogs = logs.filter((l) => ["ممتاز", "جيد جداً", "جيد"].includes(l.activity_level)).length;
  const activityRate = logs.length ? (goodActivityLogs / logs.length) * 100 : 0;

  const workersWithLogs = workers.filter((w) => workerLogs(w.id).length > 0).length;
  const workersWithTasks = workers.filter((w) => workerTasks(w.id).length > 0).length;
  const activeWorkers = workers.filter((w) => w.status === "نشط").length;

  return [
    { label: "اكتمال الاسم الكامل", value: pct(filled("full_name")) },
    { label: "اكتمال رقم الهوية", value: pct(filled("national_id")) },
    { label: "تحديد الجنس", value: pct(filled("gender")) },
    { label: "تسجيل حالة الإعاقة", value: pct(workers.filter((w) => w.is_disabled !== undefined).length) },
    { label: "تسجيل رقم الجوال", value: pct(filled("phone")) },
    { label: "تسجيل البريد الإلكتروني", value: pct(filled("email")) },
    { label: "تحديد المدينة", value: pct(filled("city")) },
    { label: "تحديد المنطقة", value: pct(filled("region")) },
    { label: "تحديد المسمى الوظيفي", value: pct(filled("job_title")) },
    { label: "تحديد نوع الدوام", value: pct(filled("work_type")) },
    { label: "تسجيل الراتب", value: pct(filled("salary")) },
    { label: "الربط بمنشأة", value: pct(filled("company_id")) },
    { label: "نشاط حالة العقد", value: pct(activeWorkers) },
    { label: "تسجيل تاريخ بداية العقد", value: pct(filled("contract_start")) },
    { label: "تسجيل تاريخ نهاية العقد", value: pct(filled("contract_end")) },
    { label: "تحديد أيام العمل المتفق عليها", value: pct(filled("agreed_work_days")) },
    { label: "تحديد أيام الإجازة السنوية", value: pct(filled("annual_leave_days")) },
    { label: "وجود مهام موكلة للموظفين", value: pct(workersWithTasks) },
    { label: "نسبة إنجاز المهام الإجمالية", value: completionRate },
    { label: "تسجيل سجلات ساعات العمل", value: pct(workersWithLogs) },
    { label: "انتظام تسجيل الدخول والخروج", value: pct(workersWithLogs) },
    { label: "مستوى النشاط العام (جيد فأعلى)", value: activityRate },
  ];
}

export default function CompanyOverviewTab({ companyId }) {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [w, p] = await Promise.all([
        base44.entities.RemoteWorker.filter({ company_id: companyId }),
        base44.entities.Project.filter({ company_id: companyId }),
      ]);
      setWorkers(w);
      setProjects(p);
      const projectIds = p.map((pr) => pr.id);
      const allTasks = projectIds.length ? await base44.entities.Task.filter({}) : [];
      const companyTasks = allTasks.filter((t) => projectIds.includes(t.project_id));
      setTasks(companyTasks);
      const workerIds = w.map((wk) => wk.id);
      const allLogs = await base44.entities.PerformanceLog.list("-date", 200);
      setLogs(allLogs.filter((l) => workerIds.includes(l.worker_id)));
    } finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const activeWorkers = workers.filter((w) => w.status === "نشط").length;
  const avgProgress = projects.length ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length) : 0;
  const completedTasks = tasks.filter((t) => t.status === "مكتملة").length;

  const statusColor = {
    "نشط": "bg-emerald-100 text-emerald-700",
    "معلق": "bg-amber-100 text-amber-700",
    "منتهي": "bg-red-100 text-red-700",
  };
  const projectStatusColor = {
    "جديد": "bg-blue-100 text-blue-700",
    "قيد التنفيذ": "bg-amber-100 text-amber-700",
    "مكتمل": "bg-emerald-100 text-emerald-700",
    "متوقف": "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="العاملون" value={workers.length} icon={Users} color="primary" />
        <StatCard title="العاملون النشطون" value={activeWorkers} icon={CheckCircle2} color="amber" />
        <StatCard title="المشاريع" value={projects.length} icon={FolderKanban} color="green" />
        <StatCard title="متوسط الإنجاز" value={`${avgProgress}%`} icon={ClipboardList} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border p-6">
          <h3 className="text-sm font-bold mb-4">حالة العاملين</h3>
          {workers.length === 0 ? (
            <p className="text-xs text-muted-foreground">لا يوجد عاملون بعد</p>
          ) : (
            <div className="space-y-2">
              {workers.map((w) => (
                <div key={w.id} className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-muted/40">
                  <span className="font-medium">{w.full_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[w.status] || ""}`}>{w.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border p-6">
          <h3 className="text-sm font-bold mb-4">تقدم المشاريع</h3>
          {projects.length === 0 ? (
            <p className="text-xs text-muted-foreground">لا توجد مشاريع بعد</p>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{p.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${projectStatusColor[p.status] || ""}`}>{p.status}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${p.progress || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground -mb-2">إجمالي المهام: {tasks.length} | المهام المكتملة: {completedTasks}</p>

      <ComplianceOverview points={computeCompliancePoints(workers, tasks, logs)} />
    </div>
  );
}