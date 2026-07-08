import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wallet, Building2, Users, TrendingUp } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function CashFlow() {
  const [transactions, setTransactions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [t, c, w] = await Promise.all([
        base44.entities.CashTransaction.list("-date", 500),
        base44.entities.Company.list(),
        base44.entities.RemoteWorker.list(),
      ]);
      setTransactions(t);
      setCompanies(c);
      setWorkers(w);
    } finally { setLoading(false); }
  };

  const getCompanyName = (id) => companies.find((c) => c.id === id)?.name || "—";
  const getWorkerName = (id) => workers.find((w) => w.id === id)?.full_name || "—";

  const setupFees = transactions.filter((t) => t.type === "رسوم تأسيس");
  const subscriptions = transactions.filter((t) => t.type === "اشتراك شهري");

  const totalSetupFees = setupFees.reduce((s, t) => s + (t.amount || 0), 0);
  const totalSubscriptions = subscriptions.reduce((s, t) => s + (t.amount || 0), 0);
  const totalRevenue = totalSetupFees + totalSubscriptions;

  const monthlyMap = {};
  transactions.forEach((t) => {
    const month = (t.date || "").slice(0, 7);
    if (!month) return;
    if (!monthlyMap[month]) monthlyMap[month] = { month, "رسوم تأسيس": 0, "اشتراكات شهرية": 0 };
    if (t.type === "رسوم تأسيس") monthlyMap[month]["رسوم تأسيس"] += t.amount || 0;
    else monthlyMap[month]["اشتراكات شهرية"] += t.amount || 0;
  });
  const chartData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="التدفقات النقدية" description="بيان الإيرادات الناتجة عن رسوم التأسيس واشتراكات العاملين الشهرية" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalSetupFees.toLocaleString()} ر.س</p>
            <p className="text-xs text-muted-foreground">إجمالي رسوم التأسيس ({setupFees.length} منشأة)</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalSubscriptions.toLocaleString()} ر.س</p>
            <p className="text-xs text-muted-foreground">إجمالي الاشتراكات الشهرية ({subscriptions.length} حركة)</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} ر.س</p>
            <p className="text-xs text-muted-foreground">إجمالي التدفقات النقدية</p>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-card border rounded-2xl p-6 mb-8">
          <h3 className="font-bold mb-4">التدفقات النقدية الشهرية</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="رسوم تأسيس" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="اشتراكات شهرية" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {transactions.length === 0 ? (
        <EmptyState icon={Wallet} title="لا توجد حركات نقدية بعد" description="سيتم تسجيل رسوم التأسيس تلقائياً عند إضافة منشأة جديدة، والاشتراكات الشهرية تلقائياً في بداية كل شهر" />
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-4 font-medium">النوع</th>
                  <th className="text-right p-4 font-medium">المنشأة</th>
                  <th className="text-right p-4 font-medium">الموظف</th>
                  <th className="text-right p-4 font-medium">المبلغ</th>
                  <th className="text-right p-4 font-medium">التاريخ</th>
                  <th className="text-right p-4 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.type === "رسوم تأسيس" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{getCompanyName(t.company_id)}</td>
                    <td className="p-4 text-muted-foreground">{t.worker_id ? getWorkerName(t.worker_id) : "—"}</td>
                    <td className="p-4 font-medium">{(t.amount || 0).toLocaleString()} ر.س</td>
                    <td className="p-4 text-muted-foreground">{t.date}</td>
                    <td className="p-4">{t.status}</td>
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