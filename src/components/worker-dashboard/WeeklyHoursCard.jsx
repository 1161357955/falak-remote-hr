import React from "react";
import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const WEEKLY_TARGET = 48;

export default function WeeklyHoursCard({ logs = [] }) {
  const totalHours = logs.reduce((sum, l) => sum + (l.hours_worked || 0), 0);
  const percentage = Math.min(100, Math.round((totalHours / WEEKLY_TARGET) * 100));

  return (
    <div className="bg-card rounded-2xl border p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        ساعات العمل هذا الأسبوع
      </h3>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold">{totalHours.toFixed(1)} <span className="text-sm text-muted-foreground font-normal">من {WEEKLY_TARGET} ساعة</span></span>
        <span className="text-sm font-medium text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2.5" />
    </div>
  );
}