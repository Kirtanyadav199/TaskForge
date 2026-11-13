import React from "react";
import type { TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; textColor: string }
> = {
  LOW: { label: "Low", textColor: "text-[#737373]" },
  MEDIUM: { label: "Medium", textColor: "text-[#171717]" },
  HIGH: { label: "High", textColor: "text-[#B45309]" },
  URGENT: { label: "Urgent", textColor: "text-[#B91C1C] font-medium" },
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <span className={cn("text-xs", config.textColor, className)}>
      {config.label}
    </span>
  );
}

export { PRIORITY_CONFIG };
