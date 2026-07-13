import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProjectWorkersField({ workers, selectedIds = [], onChange }) {
  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((i) => i !== id));
    else onChange([...selectedIds, id]);
  };

  return (
    <div>
      <Label>الموظفون المعينون على المشروع</Label>
      <div className="mt-1.5 border rounded-md max-h-40 overflow-y-auto divide-y">
        {workers.length === 0 && <p className="text-xs text-muted-foreground p-3">لا يوجد موظفون</p>}
        {workers.map((w) => (
          <label key={w.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent">
            <Checkbox checked={selectedIds.includes(w.id)} onCheckedChange={() => toggle(w.id)} />
            {w.full_name}
          </label>
        ))}
      </div>
    </div>
  );
}