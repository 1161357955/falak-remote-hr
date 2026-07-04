import React from "react";

export default function ReportField({ index, label, value }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-dashed pb-2">
      <span className="text-xs text-muted-foreground w-5 shrink-0">{index}.</span>
      <span className="text-sm text-muted-foreground shrink-0">{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}