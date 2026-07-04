import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import KanbanCard from "@/components/tasks/KanbanCard";
import TaskCommentsDialog from "@/components/tasks/TaskCommentsDialog";
import { useToast } from "@/components/ui/use-toast";

const STATUSES = ["جديدة", "قيد التنفيذ", "مكتملة", "ملغاة"];

export default function TasksKanban() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genProject, setGenProject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(null);
  const [commentsTask, setCommentsTask] = useState(null);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [t, p, w] = await Promise.all([
        base44.entities.Task.list("-created_date"),
        base44.entities.Project.list(),
        base44.entities.RemoteWorker.list(),
      ]);
      setTasks(t);
      setProjects(p);
      setWorkers(w);
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

  const handleGenerate = async () => {
    if (!genProject) {
      toast({ title: "اختر مشروعاً أولاً", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const project = projects.find((p) => p.id === genProject);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `اقترح 5 مهام عمل واقعية ومفصلة لمشروع بعنوان "${project.title}" ووصفه: "${project.description || ""}". لكل مهمة أعطِ عنواناً قصيراً ووصفاً من جملتين وأولوية (منخفضة/متوسطة/عالية/عاجلة).`,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["منخفضة", "متوسطة", "عالية", "عاجلة"] },
                },
              },
            },
          },
        },
      });
      const newTasks = (result.tasks || []).map((t) => ({ ...t, project_id: genProject, status: "جديدة" }));
      if (newTasks.length) {
        await base44.entities.Task.bulkCreate(newTasks);
        loadData();
        toast({ title: `تم توليد ${newTasks.length} مهام بنجاح` });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleImprove = async (task) => {
    setImproving(task.id);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `حسّن وصف المهمة التالية ليكون أوضح وأكثر تفصيلاً واحترافية، مع الحفاظ على المعنى الأساسي.\nعنوان المهمة: ${task.title}\nالوصف الحالي: ${task.description || "لا يوجد"}`,
        response_json_schema: { type: "object", properties: { improved_description: { type: "string" } } },
      });
      await base44.entities.Task.update(task.id, { description: result.improved_description });
      loadData();
      toast({ title: "تم تحسين وصف المهمة بالذكاء الاصطناعي" });
    } finally {
      setImproving(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="لوحة المهام" description="تابع تقدم المهام وحرّكها بسهولة بين الحالات">
        <div className="flex items-center gap-2">
          <Select value={genProject} onValueChange={setGenProject}>
            <SelectTrigger className="w-48"><SelectValue placeholder="اختر مشروعاً للتوليد" /></SelectTrigger>
            <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            <Wand2 className="w-4 h-4" /> {generating ? "جارٍ التوليد..." : "توليد مهام بالذكاء الاصطناعي"}
          </Button>
        </div>
      </PageHeader>

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
                      onImprove={handleImprove}
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
      {improving && (
        <div className="fixed bottom-6 left-6 bg-card border rounded-xl px-4 py-2 text-sm flex items-center gap-2 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> جارٍ تحسين المهمة...
        </div>
      )}

      <TaskCommentsDialog open={!!commentsTask} onOpenChange={(v) => !v && setCommentsTask(null)} task={commentsTask} />
    </div>
  );
}