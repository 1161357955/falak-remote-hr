import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Users, FolderKanban, ClipboardList, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ComplianceOverview from "@/components/dashboard/ComplianceOverview";
import ReportChannels from "@/components/dashboard/ReportChannels";

export default function Dashboard() {
  const [stats, setStats] = useState({ companies: 0, workers: 0, projects: 0, tasks: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [tasksByStatus, setTasksByStatus] = useState([]);
  const [compliancePoints, setCompliancePoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companies, workers, projects, tasks, logs] = await Promise.all([
        base44.entities.Company.list(),
        base44.entities.RemoteWorker.list(),
        base44.entities.Project.list(),
        base44.entities.Task.list("-created_date", 50),
        base44.entities.PerformanceLog.list("-date", 200),
      ]);

      setStats({
        companies: companies.length,
        workers: workers.length,
        projects: projects.length,
        tasks: tasks.length,
      });

      setRecentTasks(tasks.slice(0, 5));

      const statusCounts = { "جديدة": 0, "قيد التنفيذ": 0, "مكتملة": 0, "ملغاة": 0 };
      tasks.forEach((t) => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });
      setTasksByStatus(
        Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
      );

      setCompliancePoints(computeCompliancePoints(workers, tasks, logs));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="لوحة التحكم" description="نظرة شاملة على منصة فلك للعمل عن بُعد" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="المنشآت" value={stats.companies} icon={Building2} color="primary" />
        <StatCard title="العاملون عن بُعد" value={stats.workers} icon={Users} color="amber" />
        <StatCard title="المشاريع" value={stats.projects} icon={FolderKanban} color="green" />
        <StatCard title="المهام" value={stats.tasks} icon={ClipboardList} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-2xl border p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            توزيع المهام حسب الحالة
          </h3>
          {tasksByStatus.some((t) => t.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {tasksByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">لا توجد مهام بعد</div>
          )}
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            {tasksByStatus.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span>{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            آخر المهام
          </h3>
          {recentTasks.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">لا توجد مهام بعد</div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.due_date || "بدون تاريخ"}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickLink to="/companies" icon={Building2} label="إضافة منشأة" color="bg-blue-50 text-blue-700" />
        <QuickLink to="/workers" icon={Users} label="إضافة موظف" color="bg-amber-50 text-amber-700" />
        <QuickLink to="/projects" icon={FolderKanban} label="إنشاء مشروع" color="bg-emerald-50 text-emerald-700" />
      </div>

      <div className="mb-8">
        <ComplianceOverview points={compliancePoints} />
      </div>

      <ReportChannels />
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    "جديدة": "bg-blue-100 text-blue-700",
    "قيد التنفيذ": "bg-amber-100 text-amber-700",
    "مكتملة": "bg-emerald-100 text-emerald-700",
    "ملغاة": "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

function QuickLink({ to, icon: Icon, label, color }) {
  return (
    <Link to={to} className={`flex items-center gap-3 p-4 rounded-2xl ${color} hover:opacity-80 transition-opacity`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}