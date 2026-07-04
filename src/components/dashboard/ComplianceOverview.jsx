import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

function statusStyle(pct) {
  if (pct >= 80) return { color: "text-emerald-600", bar: "bg-emerald-500", icon: CheckCircle2 };
  if (pct >= 50) return { color: "text-amber-600", bar: "bg-amber-500", icon: AlertTriangle };
  return { color: "text-red-600", bar: "bg-red-500", icon: XCircle };
}

export default function ComplianceOverview({ points }) {
  return (
    <div className="bg-card rounded-2xl border p-6">
      <h3 className="text-lg font-bold mb-1">ملخص الامتثال لنقاط الأداء الـ22</h3>
      <p className="text-xs text-muted-foreground mb-4">مؤشر مباشر لمدى استيفاء متطلبات برنامج العمل عن بُعد لكل نقطة</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {points.map((p, i) => {
          const pct = Math.max(0, Math.min(100, Math.round(p.value)));
          const { color, bar, icon: Icon } = statusStyle(pct);
          return (
            <div key={i} className="border rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-xs font-medium">{p.label}</span>
                </div>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
              </div>
              <p className={`text-xs font-bold mt-1 ${color}`}>{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}