import React from "react";

const statusColor = {
  "جديدة": "bg-blue-500",
  "قيد التنفيذ": "bg-amber-500",
  "مكتملة": "bg-emerald-500",
  "ملغاة": "bg-red-500",
};

export default function CalendarDayCell({ date, dayTasks, isCurrentMonth, isToday, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[92px] p-2 rounded-xl border text-right transition-colors flex flex-col gap-1
      ${isCurrentMonth ? "bg-card" : "bg-muted/30"}
      ${isSelected ? "border-primary ring-1 ring-primary" : "border-border"}
      hover:border-primary/50`}
    >
      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
        {date.getDate()}
      </span>
      <div className="space-y-1">
        {dayTasks.slice(0, 2).map((t) => (
          <div key={t.id} className="flex items-center gap-1 text-[10px] truncate">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor[t.status] || "bg-gray-400"}`} />
            <span className="truncate">{t.title}</span>
          </div>
        ))}
        {dayTasks.length > 2 && (
          <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 2} أخرى</span>
        )}
      </div>
    </button>
  );
}