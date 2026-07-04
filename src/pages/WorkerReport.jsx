import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportField from "@/components/reports/ReportField";

export default function WorkerReport() {
  const urlParams = new URLSearchParams(window.location.search);
  const workerId = urlParams.get("id");
  const [data, setData] = useState(null);

  useEffect(() => { loadData(); }, [workerId]);

  const loadData = async () => {
    if (!workerId) return;
    const [worker, companies, tasks, logs] = await Promise.all([
      base44.entities.RemoteWorker.get(workerId),
      base44.entities.Company.list(),
      base44.entities.Task.filter({ worker_id: workerId }),
      base44.entities.PerformanceLog.filter({ worker_id: workerId }),
    ]);
    const company = companies.find((c) => c.id === worker.company_id);
    const tasksAssigned = tasks.length;
    const tasksCompleted = tasks.filter((t) => t.status === "مكتملة").length;
    const completionRate = tasksAssigned ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;
    const totalHours = logs.reduce((s, l) => s + (l.hours_worked || 0), 0);
    const loginCount = logs.length;
    const activityLevels = logs.map((l) => l.activity_level).filter(Boolean);
    const mostCommonActivity = activityLevels.length
      ? activityLevels.sort((a, b) => activityLevels.filter((v) => v === a).length - activityLevels.filter((v) => v === b).length).pop()
      : "—";

    setData({ worker, company, tasksAssigned, tasksCompleted, completionRate, totalHours, loginCount, mostCommonActivity });
  };

  if (!workerId) return <div className="p-8 text-center text-muted-foreground">لم يتم تحديد الموظف</div>;
  if (!data) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const { worker, company, tasksAssigned, tasksCompleted, completionRate, totalHours, loginCount, mostCommonActivity } = data;

  const points = [
    ["الاسم الكامل", worker.full_name],
    ["رقم الهوية", worker.national_id],
    ["الجنس", worker.gender],
    ["من ذوي الإعاقة", worker.is_disabled ? "نعم" : "لا"],
    ["رقم الجوال", worker.phone || "—"],
    ["البريد الإلكتروني", worker.email || "—"],
    ["المدينة", worker.city || "—"],
    ["المنطقة", worker.region || "—"],
    ["المسمى الوظيفي", worker.job_title || "—"],
    ["نوع الدوام", worker.work_type],
    ["الراتب", worker.salary ? `${worker.salary} ر.س` : "—"],
    ["المنشأة", company?.name || "—"],
    ["حالة العقد", worker.status],
    ["تاريخ بداية العقد", worker.contract_start || "—"],
    ["تاريخ نهاية العقد", worker.contract_end || "—"],
    ["أيام العمل المتفق عليها", `${worker.agreed_work_days || 0} أيام/أسبوع`],
    ["أيام الإجازة السنوية", `${worker.annual_leave_days || 0} يوم`],
    ["عدد المهام الموكلة", tasksAssigned],
    ["عدد المهام المنجزة", tasksCompleted],
    ["نسبة الإنجاز", `${completionRate}%`],
    ["إجمالي ساعات العمل المسجلة", `${totalHours} ساعة`],
    ["عدد مرات تسجيل الدخول والخروج", loginCount],
    ["مستوى النشاط الأكثر تكراراً", mostCommonActivity],
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-4 print:hidden">
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> طباعة / حفظ PDF
          </Button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-8 print:shadow-none print:border-0">
          <div className="flex items-center justify-between border-b pb-6 mb-6">
            <div>
              <h1 className="text-xl font-bold text-primary">تقرير العامل عن بُعد</h1>
              <p className="text-sm text-muted-foreground mt-1">وفق معايير وزارة الموارد البشرية والتنمية الاجتماعية</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">تاريخ التقرير</p>
              <p className="text-sm font-medium">{new Date().toLocaleDateString("ar-SA")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {points.map(([label, value], i) => (
              <ReportField key={i} index={i + 1} label={label} value={value} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}