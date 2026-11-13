"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { tasksApi } from "@/lib/api/tasks";
import { ApiError } from "@/lib/api/client";
import type { Member, TaskPriority } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const createTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").trim(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  labels: z.string().optional(),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

interface CreateTaskDialogProps {
  orgId: string;
  projectId: string;
  members: Member[];
}

export function CreateTaskDialog({
  orgId,
  projectId,
  members,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      assigneeId: "",
      dueDate: "",
      labels: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateTaskFormValues) => {
      const parsedLabels = values.labels
        ? values.labels
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean)
        : [];

      return tasksApi.createTask(orgId, projectId, {
        title: values.title,
        description: values.description?.trim() || undefined,
        priority: values.priority,
        assigneeId:
          values.assigneeId && values.assigneeId !== "unassigned"
            ? values.assigneeId
            : undefined,
        dueDate: values.dueDate || undefined,
        labels: parsedLabels.length > 0 ? parsedLabels : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "project", projectId],
      });
      toast.success("Task created");
      reset();
      setPriority("MEDIUM");
      setAssigneeId("unassigned");
      setServerError(null);
      setOpen(false);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to create task";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (values: CreateTaskFormValues) => {
    setServerError(null);
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" strokeWidth={1.75} />
          <span>New task</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[440px] rounded-[6px] border border-border p-6 shadow-xs">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-semibold text-foreground">
            New task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {serverError && (
            <div className="border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-medium">
              Title
            </Label>
            <Input
              id="task-title"
              type="text"
              placeholder="e.g. Fix navigation issue"
              disabled={mutation.isPending}
              {...register("title")}
              className="h-9 text-sm"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="task-desc"
              placeholder="Detailed description of the task"
              rows={3}
              disabled={mutation.isPending}
              {...register("description")}
              className="resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-priority" className="text-xs font-medium">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(val: TaskPriority) => {
                  setPriority(val);
                  setValue("priority", val);
                }}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="task-priority" className="h-9 w-full text-sm">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-assignee" className="text-xs font-medium">
                Assignee
              </Label>
              <Select
                value={assigneeId}
                onValueChange={(val: string) => {
                  setAssigneeId(val);
                  setValue(
                    "assigneeId",
                    val === "unassigned" ? "" : val
                  );
                }}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="task-assignee" className="h-9 w-full text-sm">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId._id} value={m.userId._id}>
                      {m.userId.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-due-date" className="text-xs font-medium">
                Due date
              </Label>
              <Input
                id="task-due-date"
                type="date"
                disabled={mutation.isPending}
                {...register("dueDate")}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-labels" className="text-xs font-medium">
                Labels
              </Label>
              <Input
                id="task-labels"
                type="text"
                placeholder="bug, ui, backend"
                disabled={mutation.isPending}
                {...register("labels")}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => {
                reset();
                setPriority("MEDIUM");
                setAssigneeId("unassigned");
                setServerError(null);
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving…" : "Create task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
