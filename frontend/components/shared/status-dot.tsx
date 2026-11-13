import React from "react";
import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dotColor: string }
> = {
  TODO: { label: "Todo", dotColor: "bg-[#737373]" },
  IN_PROGRESS: { label: "In progress", dotColor: "bg-[#2563EB]" },
  REVIEW: { label: "Review", dotColor: "bg-[#B45309]" },
  DONE: { label: "Done", dotColor: "bg-[#15803D]" },
};

interface StatusDotProps {
  status: TaskStatus;
  className?: string;
  showText?: boolean;
}

export function StatusDot({
  status,
  className,
  showText = true,
}: StatusDotProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.TODO;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-foreground",
        className
      )}
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", config.dotColor)}
        aria-hidden="true"
      />
      {showText && <span>{config.label}</span>}
    </span>
  );
}

export { STATUS_CONFIG };
