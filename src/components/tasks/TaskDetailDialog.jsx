import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormDialog from "@/components/shared/FormDialog";
import TaskTimeline from "@/components/tasks/TaskTimeline";
import TaskCommentsThread from "@/components/tasks/TaskCommentsThread";

const ACCEPTANCE_COLORS = {
  "قيد الانتظار": "bg-amber-100 text-amber-700",
  "مقبولة": "bg-emerald-100 text-emerald-700",
  "مرفوضة": "bg-red-100 text-red-700",
};

export default function TaskDetailDialog({ open, onOpenChange, task, worker, onUpdated }) {
  const [processing, setProcessing] = useState(false);

  if (!task) return null;

  const acceptanceStatus = task.acceptance_status || "قيد الانتظار";

  const handleDecision = async (decision) => {
    setProcessing(true);
    try {
      await base44.entities.Task.update(task.id, { acceptance_status: decision });
      await base44.entities.TaskActivity.create({
        task_id: task.id,
        action: decision === "مقبولة" ? "accepted" : "rejected",
        description: `${decision === "مقبولة" ? "قبل" : "رفض"} ${worker?.full_name || "الموظف"} المهمة`,
        actor_name: worker?.full_name || "",
      });
      onUpdated?.({ ...task, acceptance_status: decision });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={task.title}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${ACCEPTANCE_COLORS[acceptanceStatus]}`}>{acceptanceStatus}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-muted">{task.status}</span>
        </div>

        {task.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {task.due_date && <div><span className="text-muted-foreground">تاريخ التسليم: </span>{task.due_date}</div>}
          {task.priority && <div><span className="text-muted-foreground">الأولوية: </span>{task.priority}</div>}
        </div>

        {acceptanceStatus === "قيد الانتظار" && (
          <div className="flex items-center gap-2">
            <Button onClick={() => handleDecision("مقبولة")} disabled={processing} className="gap-1.5 flex-1">
              <CheckCircle2 className="w-4 h-4" /> قبول المهمة
            </Button>
            <Button onClick={() => handleDecision("مرفوضة")} disabled={processing} variant="destructive" className="gap-1.5 flex-1">
              <XCircle className="w-4 h-4" /> رفض المهمة
            </Button>
          </div>
        )}

        <div>
          <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> الخط الزمني</h4>
          <TaskTimeline taskId={task.id} />
        </div>

        <TaskCommentsThread task={task} />
      </div>
    </FormDialog>
  );
}