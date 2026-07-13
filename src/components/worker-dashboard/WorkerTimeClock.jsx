import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Clock } from "lucide-react";
import { format } from "date-fns";

export default function WorkerTimeClock({ worker, onLogUpdated }) {
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    loadTodayLog();
  }, [worker?.id]);

  const loadTodayLog = async () => {
    setLoading(true);
    const logs = await base44.entities.PerformanceLog.filter({ worker_id: worker.id, date: todayStr });
    setTodayLog(logs[0] || null);
    setLoading(false);
  };

  const handleClockIn = async () => {
    setBusy(true);
    const created = await base44.entities.PerformanceLog.create({
      worker_id: worker.id,
      date: todayStr,
      login_time: new Date().toISOString(),
      hours_worked: 0,
    });
    setTodayLog(created);
    setBusy(false);
    onLogUpdated?.();
  };

  const handleClockOut = async () => {
    if (!todayLog) return;
    setBusy(true);
    const logoutTime = new Date();
    const loginTime = new Date(todayLog.login_time);
    const hours = Math.max(0, (logoutTime.getTime() - loginTime.getTime()) / 3600000);
    const updated = await base44.entities.PerformanceLog.update(todayLog.id, {
      logout_time: logoutTime.toISOString(),
      hours_worked: Math.round(hours * 100) / 100,
    });
    setTodayLog(updated);
    setBusy(false);
    onLogUpdated?.();
  };

  if (loading) {
    return <div className="bg-card rounded-2xl border p-6 h-24 animate-pulse" />;
  }

  const hasClockedIn = !!todayLog?.login_time;
  const hasClockedOut = !!todayLog?.logout_time;

  return (
    <div className="bg-card rounded-2xl border p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        تسجيل الحضور اليومي
      </h3>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-muted-foreground">
          {!hasClockedIn && "لم تسجل بدء العمل اليوم"}
          {hasClockedIn && !hasClockedOut && (
            <>بدأت العمل في <span className="font-medium text-foreground">{format(new Date(todayLog.login_time), "HH:mm")}</span></>
          )}
          {hasClockedOut && (
            <>
              عملت اليوم من <span className="font-medium text-foreground">{format(new Date(todayLog.login_time), "HH:mm")}</span>{" "}
              إلى <span className="font-medium text-foreground">{format(new Date(todayLog.logout_time), "HH:mm")}</span>{" "}
              ({todayLog.hours_worked?.toFixed(2)} ساعة)
            </>
          )}
        </div>
        <div className="flex gap-2">
          {!hasClockedIn && (
            <Button onClick={handleClockIn} disabled={busy} className="gap-1.5">
              <LogIn className="w-4 h-4" /> تسجيل بدء العمل
            </Button>
          )}
          {hasClockedIn && !hasClockedOut && (
            <Button onClick={handleClockOut} disabled={busy} variant="outline" className="gap-1.5">
              <LogOut className="w-4 h-4" /> تسجيل نهاية العمل
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}