import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronRight, ChevronLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import CalendarDayCell from "@/components/tasks/CalendarDayCell";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, format,
} from "date-fns";
import { ar } from "date-fns/locale";

const WEEKDAYS = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

const priorityColor = {
  "منخفضة": "bg-gray-100 text-gray-600",
  "متوسطة": "bg-blue-50 text-blue-600",
  "عالية": "bg-orange-100 text-orange-700",
  "عاجلة": "bg-red-100 text-red-700",
};

export default function TasksCalendar() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [t, p] = await Promise.all([
        base44.entities.Task.list(),
        base44.entities.Project.list(),
      ]);
      setTasks(t.filter((task) => task.due_date));
      setProjects(p);
    } finally {
      setLoading(false);
    }
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.title || "—";

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const key = t.due_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedTasks = tasksByDate[format(selectedDate, "yyyy-MM-dd")] || [];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="تقويم المهام" description="عرض المهام حسب تاريخ الاستحقاق" />

      <div className="flex items-center justify-between mb-5">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-bold">{format(currentMonth, "MMMM yyyy", { locale: ar })}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 mb-8">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          return (
            <CalendarDayCell
              key={key}
              date={day}
              dayTasks={tasksByDate[key] || []}
              isCurrentMonth={isSameMonth(day, currentMonth)}
              isToday={isToday(day)}
              isSelected={isSameDay(day, selectedDate)}
              onClick={() => setSelectedDate(day)}
            />
          );
        })}
      </div>

      <div className="bg-card rounded-2xl border p-6">
        <h3 className="text-lg font-bold mb-4">
          مهام يوم {format(selectedDate, "d MMMM yyyy", { locale: ar })}
        </h3>
        {selectedTasks.length === 0 ? (
          <EmptyState icon={ClipboardList} title="لا توجد مهام" description="لا توجد مهام مستحقة في هذا اليوم" />
        ) : (
          <div className="space-y-3">
            {selectedTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 gap-3">
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">المشروع: {projectName(t.project_id)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[t.priority] || ""}`}>{t.priority}</span>
                  <span className="text-xs text-muted-foreground">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}