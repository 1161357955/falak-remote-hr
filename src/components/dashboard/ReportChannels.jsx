import React from "react";
import { Link } from "react-router-dom";
import { BarChart3, Building2, Printer } from "lucide-react";

export default function ReportChannels() {
  return (
    <div className="bg-card rounded-2xl border p-6">
      <h3 className="text-lg font-bold mb-1">قنوات تدفق التقارير</h3>
      <p className="text-xs text-muted-foreground mb-4">وصول سريع لمخرجات الامتثال والتقارير التفصيلية</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link to="/reports" className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 text-blue-700 hover:opacity-80 transition-opacity">
          <BarChart3 className="w-5 h-5" />
          <span className="font-medium text-sm">تقارير الأداء التفصيلية</span>
        </Link>
        <Link to="/companies" className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 text-emerald-700 hover:opacity-80 transition-opacity">
          <Building2 className="w-5 h-5" />
          <span className="font-medium text-sm">تقارير المنشآت</span>
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 text-amber-700 hover:opacity-80 transition-opacity text-right">
          <Printer className="w-5 h-5" />
          <span className="font-medium text-sm">طباعة ملخص الامتثال</span>
        </button>
      </div>
    </div>
  );
}