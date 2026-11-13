"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksApi } from "@/lib/api/tasks";
import { ApiError } from "@/lib/api/client";
import type { Task, TaskStatus } from "@/lib/types";
import { StatusDot } from "@/components/shared/status-dot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskStatusSelectorProps {
  orgId: string;
  projectId: string;
  task: Task;
  showText?: boolean;
}

const STATUS_OPTIONS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "REVIEW", label: "Review" },
  { status: "DONE", label: "Done" },
];

export function TaskStatusSelector({
  orgId,
  projectId,
  task,
  showText = true,
}: TaskStatusSelectorProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newStatus: TaskStatus) =>
      tasksApi.updateTask(orgId, projectId, task._id, { status: newStatus }),
    // Optimistic update
    onMutate: async (newStatus: TaskStatus) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ["org", orgId, "project", projectId],
      });
      await queryClient.cancelQueries({
        queryKey: ["org", orgId, "task", task._id],
      });

      // Snapshot previous values
      const previousSingleTask = queryClient.getQueryData<Task>([
        "org",
        orgId,
        "task",
        task._id,
      ]);

      // Optimistically update single task if cached
      if (previousSingleTask) {
        queryClient.setQueryData<Task>(
          ["org", orgId, "task", task._id],
          { ...previousSingleTask, status: newStatus }
        );
      }

      return { previousSingleTask };
    },
    onError: (err, _newStatus, context) => {
      // Rollback on error
      if (context?.previousSingleTask) {
        queryClient.setQueryData(
          ["org", orgId, "task", task._id],
          context.previousSingleTask
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "project", projectId],
      });
      const msg =
        err instanceof ApiError ? err.message : "Failed to update status";
      toast.error(msg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "project", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "task", task._id],
      });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Change status from ${task.status}`}
          className="flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 hover:bg-[#F0F0F0] focus-visible:outline-2 focus-visible:outline-ring"
        >
          <StatusDot status={task.status} showText={showText} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        onClick={(e) => e.stopPropagation()}
        className="w-36 rounded-[6px] border border-border bg-background p-1 text-xs shadow-xs"
      >
        {STATUS_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.status}
            onClick={() => {
              if (opt.status !== task.status) {
                mutation.mutate(opt.status);
              }
            }}
            className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5"
          >
            <StatusDot status={opt.status} showText={true} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
