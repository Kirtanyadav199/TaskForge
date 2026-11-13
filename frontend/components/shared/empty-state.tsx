import React from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[6px] border border-border bg-background p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionLabel && onAction && (
        <div className="mt-3">
          <Button onClick={onAction} size="sm" variant="outline">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
