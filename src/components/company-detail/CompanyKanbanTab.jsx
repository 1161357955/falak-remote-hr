import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import KanbanCard from "@/components/tasks/KanbanCard";
import TaskCommentsDialog from "@/components/tasks/TaskCommentsDialog";

const STATUSES = ["جديدة", "قيد التنفيذ", "مكتملة", "ملغاة"];

export default function CompanyKanbanTab({ companyId }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsTask, setCommentsTask] = useState(null);

  useEffect(() => { loadData(); }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, w] = await Promise.all([
        base44.entities.Project.filter({ company_id: companyId }),
        base44.entities.RemoteWorker.filter({ company_id: companyId }),
      ]);
      setProjects(p);
      setWorkers(w);
      const projectIds = p.map((pr) => pr.id);
      const allTasks = await base44.entities.Task.list("-created_date");
      setTasks(allTasks.filter((t) => projectIds.includes(t.project_id)));
    } finally { setLoading(false); }
  };

  const getName = (list, id, key) => list.find((i) => i.id === id)?.[key] || "";

  const handleDragEnd = async (result) => {
    const { draggableId, destination, source } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const newStatus = destination.droppableId;
    setTasks((prev) => prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t)));
    await base44.entities.Task.update(draggableId, { status: newStatus });
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STATUSES.map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-muted/40 rounded-2xl p-3 min-h-[300px] ${snapshot.isDraggingOver ? "bg-accent" : ""}`}
                >
                  <h3 className="text-sm font-bold mb-3 px-1 flex items-center justify-between">
                    {status}
                    <span className="text-xs text-muted-foreground font-normal">{tasks.filter((t) => t.status === status).length}</span>
                  </h3>
                  {tasks.filter((t) => t.status === status).map((task, index) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      index={index}
                      projectName={getName(projects, task.project_id, "title")}
                      workerName={getName(workers, task.worker_id, "full_name")}
                      onImprove={() => {}}
                      onOpenComments={setCommentsTask}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <TaskCommentsDialog open={!!commentsTask} onOpenChange={(v) => !v && setCommentsTask(null)} task={commentsTask} />
    </div>
  );
}