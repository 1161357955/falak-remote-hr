import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Receipt, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/ui/use-toast";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [inv, comp] = await Promise.all([
        base44.entities.Invoice.list("-issue_date", 500),
        base44.entities.Company.list(),
      ]);
      setInvoices(inv);
      setCompanies(comp);
    } finally { setLoading(false); }
  };

  const getCompanyName = (id) => companies.find((c) => c.id === id)?.name || "—";

  const markAsPaid = async (id) => {
    await base44.entities.Invoice.update(id, { status: "مدفوعة" });
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status: "مدفوعة" } : i)));
    toast({ title: "تم تحديث حالة الفاتورة إلى مدفوعة" });
  };

  const sendReminder = async (id) => {
    setSendingId(id);
    try {
      await base44.functions.invoke("sendInvoiceReminder", { invoiceId: id });
      setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, reminder_sent: true } : i)));
      toast({ title: "تم إرسال التذكير بالبريد الإلكتروني" });
    } catch (e) {
      toast({ title: "تعذر إرسال التذكير", description: "تأكد من وجود بريد إلكتروني للمنشأة", variant: "destructive" });
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="الفواتير" description="فواتير الاشتراك الشهرية بناءً على عدد الموظفين، مع رسوم التأسيس لمرة واحدة، وتصدر تلقائياً أول كل شهر" />

      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="لا توجد فواتير بعد" description="سيتم إصدار الفواتير تلقائياً في بداية كل شهر بناءً على عدد الموظفين النشطين لكل منشأة" />
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-4 font-medium">رقم الفاتورة</th>
                  <th className="text-right p-4 font-medium">المنشأة</th>
                  <th className="text-right p-4 font-medium">الفترة</th>
                  <th className="text-right p-4 font-medium">الموظفون</th>
                  <th className="text-right p-4 font-medium">الاشتراك</th>
                  <th className="text-right p-4 font-medium">رسوم التأسيس</th>
                  <th className="text-right p-4 font-medium">الإجمالي</th>
                  <th className="text-right p-4 font-medium">الاستحقاق</th>
                  <th className="text-right p-4 font-medium">الحالة</th>
                  <th className="text-right p-4 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{inv.invoice_number}</td>
                    <td className="p-4">{getCompanyName(inv.company_id)}</td>
                    <td className="p-4 text-muted-foreground">{inv.period}</td>
                    <td className="p-4">{inv.workers_count}</td>
                    <td className="p-4">{inv.subscription_amount} ر.س</td>
                    <td className="p-4">{inv.setup_fee_amount > 0 ? `${inv.setup_fee_amount} ر.س` : "—"}</td>
                    <td className="p-4 font-bold">{inv.total_amount} ر.س</td>
                    <td className="p-4 text-muted-foreground">{inv.due_date}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${inv.status === "مدفوعة" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          disabled={sendingId === inv.id}
                          onClick={() => sendReminder(inv.id)}
                        >
                          {sendingId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          تذكير
                        </Button>
                        {inv.status !== "مدفوعة" && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => markAsPaid(inv.id)}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> تم السداد
                          </Button>
                        )}
                      </div>
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