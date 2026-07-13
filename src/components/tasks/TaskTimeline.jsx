import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, RefreshCw, Circle } from "lucide-react";

const ACTION_ICONS = {
  accepted: CheckCircle2,
  rejected: XCircle,
  status_changed: RefreshCw,
};

const ACTION_COLORS = {
  accepted: "text-emerald-600",
  rejected: "text-red-600",
  status_changed: "text-blue-600",
};

export default function TaskTimeline({ taskId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.TaskActivity.filter({ task_id: taskId }, "-created_date").then((data) => {
      setActivities(data);
      setLoading(false);
    });
  }, [taskId]);

  if (loading) return <p className="text-xs text-muted-foreground">جارٍ التحميل...</p>;
  if (activities.length === 0) return <p className="text-xs text-muted-foreground">لا توجد أحداث مسجلة بعد</p>;

  return (
    <div className="space-y-3 border-r-2 border-muted pr-4">
      {activities.map((a) => {
        const Icon = ACTION_ICONS[a.action] || Circle;
        return (
          <div key={a.id} className="relative">
            <div className={`absolute -right-[21px] top-0.5 w-3 h-3 rounded-full bg-background border-2 border-current ${ACTION_COLORS[a.action] || "text-muted-foreground"}`} />
            <div className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${ACTION_COLORS[a.action] || "text-muted-foreground"}`} />
              <p className="text-xs font-medium">{a.description}</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(a.created_date).toLocaleString("ar-SA")}</p>
          </div>
        );
      })}
    </div>
  );
}