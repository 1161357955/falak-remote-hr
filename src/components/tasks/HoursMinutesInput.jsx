import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HoursMinutesInput({ label, hours, minutes, onHoursChange, onMinutesChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input type="number" min="0" placeholder="ساعات" value={hours} onChange={(e) => onHoursChange(e.target.value)} />
        </div>
        <div className="flex-1">
          <Input type="number" min="0" max="59" placeholder="دقائق" value={minutes} onChange={(e) => onMinutesChange(e.target.value)} />
        </div>
      </div>
    </div>
  );
}