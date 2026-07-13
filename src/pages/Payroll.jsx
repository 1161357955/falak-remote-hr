import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/ui/use-toast";

const currentPeriod = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [period, setPeriod] = useState(currentPeriod());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [p, w, c] = await Promise.all([
        base44.entities.Payroll.list("-period"),
        base44.entities.RemoteWorker.list(),
        base44.entities.Company.list(),
      ]);
      setPayrolls(p);
      setWorkers(w);
      setCompanies(c);
    } finally {
      setLoading(false);
    }
  };

  const periods = [...new Set(payrolls.map((p) => p.period))];
  if (!periods.includes(period)) periods.unshift(period);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateMonthlyPayroll", { period });
      toast({ title: "تم إصدار الرواتب", description: `تم إصدار ${res.data.generated} كشف راتب لشهر ${period}` });
      loadData();
    } catch {
      toast({ title: "خطأ", description: "تعذر إصدار كشوف الرواتب", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const getWorkerName = (id) => workers.find((w) => w.id === id)?.full_name || "—";
  const getCompanyName = (id) => companies.find((c) => c.id === id)?.name || "—";

  const filtered = payrolls.filter((p) => p.period === period);
  const totalWages = filtered.reduce((sum, p) => sum + (p.calculated_wage || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="كشوف الرواتب" description="حساب أجور الموظفين تلقائياً بناءً على ساعات العمل الفعلية">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {periods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerate} disabled={generating} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} /> إصدار رواتب هذا الشهر
        </Button>
      </PageHeader>

      {filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="لا توجد كشوف رواتب" description="اضغط على زر الإصدار لحساب رواتب هذه الفترة" />
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">إجمالي الرواتب المستحقة عن {period}</span>
            <span className="text-lg font-bold text-primary">{totalWages.toFixed(0)} ر.س</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-4 font-medium">الموظف</th>
                  <th className="text-right p-4 font-medium">المنشأة</th>
                  <th className="text-right p-4 font-medium">الساعات الفعلية</th>
                  <th className="text-right p-4 font-medium">الساعات المستهدفة</th>
                  <th className="text-right p-4 font-medium">نسبة التغطية</th>
                  <th className="text-right p-4 font-medium">الأجر/ساعة</th>
                  <th className="text-right p-4 font-medium">الراتب المستحق</th>
                  <th className="text-right p-4 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{getWorkerName(p.worker_id)}</td>
                    <td className="p-4 text-muted-foreground">{getCompanyName(p.company_id)}</td>
                    <td className="p-4">{p.actual_hours}</td>
                    <td className="p-4 text-muted-foreground">{p.target_hours}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.compliance_percentage >= 90 ? "bg-emerald-100 text-emerald-700" : p.compliance_percentage >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {p.compliance_percentage}%
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{p.hourly_rate?.toFixed(2)} ر.س</td>
                    <td className="p-4 font-bold text-primary">{p.calculated_wage?.toFixed(2)} ر.س</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === "مدفوع" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {p.status}
                      </span>
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