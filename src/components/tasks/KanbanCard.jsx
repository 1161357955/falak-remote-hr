import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const priorityColor = {
  "منخفضة": "bg-gray-100 text-gray-600",
  "متوسطة": "bg-blue-50 text-blue-600",
  "عالية": "bg-orange-100 text-orange-700",
  "عاجلة": "bg-red-100 text-red-700",
};

export default function KanbanCard({ task, index, projectName, workerName, onImprove, onOpenComments }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-card border rounded-xl p-3 mb-2 shadow-sm ${snapshot.isDragging ? "shadow-md ring-2 ring-primary/30" : ""}`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-bold">{task.title}</h4>
            <div className="flex items-center shrink-0">
              <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground" onClick={() => onOpenComments(task)}>
                <MessageSquare className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-6 h-6 text-amber-500" onClick={() => onImprove(task)}>
                <Sparkles className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={`px-2 py-0.5 rounded-full ${priorityColor[task.priority] || ""}`}>{task.priority}</span>
            {task.due_date && <span>{task.due_date}</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">{projectName}{workerName ? ` · ${workerName}` : ""}</div>
        </div>
      )}
    </Draggable>
  );
}