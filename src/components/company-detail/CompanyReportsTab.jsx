import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";

export default function CompanyReportsTab({ companyId }) {
  const [logs, setLogs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const w = await base44.entities.RemoteWorker.filter({ company_id: companyId });
      setWorkers(w);
      const workerIds = w.map((wk) => wk.id);
      const allLogs = await base44.entities.PerformanceLog.list("-date", 200);
      setLogs(allLogs.filter((l) => workerIds.includes(l.worker_id)));
    } finally { setLoading(false); }
  };

  const getWorkerName = (id) => workers.find((w) => w.id === id)?.full_name || "—";

  const activityColor = {
    "ممتاز": "bg-emerald-100 text-emerald-700",
    "جيد جداً": "bg-blue-100 text-blue-700",
    "جيد": "bg-cyan-100 text-cyan-700",
    "مقبول": "bg-amber-100 text-amber-700",
    "ضعيف": "bg-red-100 text-red-700",
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-bold mb-2">تقارير الـ22 نقطة لكل موظف</h3>
        <div className="flex flex-wrap gap-2">
          {workers.map((w) => (
            <Button key={w.id} variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/worker-report?id=${w.id}`, "_blank")}>
              <FileText className="w-3.5 h-3.5" /> {w.full_name}
            </Button>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={BarChart3} title="لا توجد سجلات أداء" description="لا توجد سجلات أداء لموظفي هذه المنشأة بعد" />
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-4 font-medium">الموظف</th>
                  <th className="text-right p-4 font-medium">التاريخ</th>
                  <th className="text-right p-4 font-medium">الساعات</th>
                  <th className="text-right p-4 font-medium">موكلة</th>
                  <th className="text-right p-4 font-medium">منجزة</th>
                  <th className="text-right p-4 font-medium">النشاط</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{getWorkerName(l.worker_id)}</td>
                    <td className="p-4 text-muted-foreground">{l.date}</td>
                    <td className="p-4">{l.hours_worked || 0}</td>
                    <td className="p-4">{l.tasks_assigned || 0}</td>
                    <td className="p-4">{l.tasks_completed || 0}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${activityColor[l.activity_level] || ""}`}>{l.activity_level}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}