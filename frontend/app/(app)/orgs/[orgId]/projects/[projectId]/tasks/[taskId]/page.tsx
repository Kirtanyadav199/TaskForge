"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { tasksApi } from "@/lib/api/tasks";
import { membersApi } from "@/lib/api/members";
import { useOrgRole } from "@/lib/hooks/use-org-role";
import { ApiError } from "@/lib/api/client";
import { formatDateUTC, toInputDateFormat } from "@/lib/format";
import type { Task, TaskPriority, TaskStatus, Member } from "@/lib/types";
import { TaskComments } from "@/components/tasks/task-comments";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TaskDetailLoadedProps {
  task: Task;
  orgId: string;
  projectId: string;
  taskId: string;
  members: Member[];
  isAdmin: boolean;
}

function TaskDetailLoaded({
  task,
  orgId,
  projectId,
  taskId,
  members,
  isAdmin,
}: TaskDetailLoadedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Editing state for Title and Description initialized directly from task
  const [isEditingTitleDesc, setIsEditingTitleDesc] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(
    task.description || ""
  );

  // Labels edit state initialized directly from task
  const [labelsInput, setLabelsInput] = useState(
    task.labels ? task.labels.join(", ") : ""
  );

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (updates: Parameters<typeof tasksApi.updateTask>[3]) =>
      tasksApi.updateTask(orgId, projectId, taskId, updates),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(["org", orgId, "task", taskId], updatedTask);
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "project", projectId, "tasks"],
      });
      toast.success("Task updated");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to update task";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.deleteTask(orgId, projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "project", projectId],
      });
      toast.success("Task deleted");
      router.replace(`/orgs/${orgId}/projects/${projectId}`);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to delete task";
      toast.error(msg);
    },
  });

  const handleSaveTitleDesc = () => {
    if (!editTitle.trim() || editTitle.trim().length < 2) {
      toast.error("Title must be at least 2 characters");
      return;
    }
    updateMutation.mutate({
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
    });
    setIsEditingTitleDesc(false);
  };

  const handleCancelTitleDesc = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setIsEditingTitleDesc(false);
  };

  const handleLabelsBlur = () => {
    const parsed = labelsInput
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    const currentJoined = task.labels ? task.labels.join(",") : "";
    const newJoined = parsed.join(",");
    if (currentJoined !== newJoined) {
      updateMutation.mutate({ labels: parsed });
    }
  };

  const memberMap = React.useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => {
      map.set(m.userId._id, m.userId.name);
    });
    return map;
  }, [members]);

  const creatorName = task.createdBy
    ? memberMap.get(task.createdBy) || "Team member"
    : "Team member";

  return (
    <div className="space-y-6">
      {/* Top action / back link */}
      <div className="flex items-center justify-between">
        <Link
          href={`/orgs/${orgId}/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to tasks</span>
        </Link>

        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5 mr-1.5" />
            <span>Delete task</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Column: Title, Description, Comments */}
        <div className="md:col-span-2 space-y-6">
          {/* Title and Description */}
          <div className="rounded-[6px] border border-border bg-background p-5 space-y-4">
            {isEditingTitleDesc ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="task-title-edit" className="text-xs font-medium">
                    Title
                  </Label>
                  <Input
                    id="task-title-edit"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-9 text-base font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="task-desc-edit" className="text-xs font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="task-desc-edit"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={5}
                    placeholder="Add a more detailed description…"
                    className="resize-none text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelTitleDesc}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveTitleDesc}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-lg font-semibold text-foreground leading-snug">
                    {task.title}
                  </h1>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setIsEditingTitleDesc(true)}
                    className="shrink-0 text-xs"
                  >
                    Edit
                  </Button>
                </div>

                <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {task.description ? (
                    task.description
                  ) : (
                    <span className="text-muted-foreground italic">
                      No description provided. Click Edit to add one.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <TaskComments
            orgId={orgId}
            projectId={projectId}
            taskId={taskId}
          />
        </div>

        {/* Side Column: Properties immediately saved on change */}
        <div className="space-y-5 rounded-[6px] border border-border bg-[#FAFAFA] p-4 text-xs">
          <div className="border-b border-border pb-3">
            <span className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Properties
            </span>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select
              value={task.status}
              onValueChange={(val: TaskStatus) =>
                updateMutation.mutate({ status: val })
              }
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="h-8 w-full bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
                <SelectItem value="TODO">Todo</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <Select
              value={task.priority}
              onValueChange={(val: TaskPriority) =>
                updateMutation.mutate({ priority: val })
              }
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="h-8 w-full bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Assignee</Label>
            <Select
              value={task.assigneeId || "unassigned"}
              onValueChange={(val: string) => {
                if (val && val !== "unassigned") {
                  updateMutation.mutate({ assigneeId: val });
                }
              }}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="h-8 w-full bg-background text-xs">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
                {task.assigneeId ? null : (
                  <SelectItem value="unassigned" disabled>
                    Unassigned
                  </SelectItem>
                )}
                {members.map((m) => (
                  <SelectItem key={m.userId._id} value={m.userId._id}>
                    {m.userId.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Due date</Label>
            <Input
              type="date"
              value={toInputDateFormat(task.dueDate)}
              onChange={(e) => {
                if (e.target.value) {
                  updateMutation.mutate({ dueDate: e.target.value });
                }
              }}
              disabled={updateMutation.isPending}
              className="h-8 bg-background text-xs"
            />
          </div>

          {/* Labels */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Labels (comma separated)
            </Label>
            <Input
              type="text"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
              onBlur={handleLabelsBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              disabled={updateMutation.isPending}
              className="h-8 bg-background text-xs"
            />
          </div>

          {/* Readonly Meta */}
          <div className="space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <div>
              <span className="text-[11px] block">Created by</span>
              <span className="text-foreground">{creatorName}</span>
            </div>
            <div>
              <span className="text-[11px] block">Created on</span>
              <span className="text-foreground">
                {formatDateUTC(task.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Task AlertDialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent className="max-w-[400px] rounded-[6px] border border-border p-6 shadow-xs">
          <AlertDialogHeader className="gap-1 text-left">
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Delete task
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-3 gap-2 sm:justify-end">
            <AlertDialogCancel
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? "Saving…" : "Delete task"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string; taskId: string }>;
}) {
  const { orgId, projectId, taskId } = use(params);
  const { isAdmin } = useOrgRole(orgId);

  const {
    data: task,
    isLoading: isTaskLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["org", orgId, "task", taskId],
    queryFn: () => tasksApi.getTask(orgId, projectId, taskId),
    staleTime: 30 * 1000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["org", orgId, "members"],
    queryFn: () => membersApi.getMembers(orgId),
    staleTime: 30 * 1000,
  });

  if (isTaskLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="rounded-[6px] border border-border p-8 text-center space-y-3">
        <p className="text-xs text-destructive">Task not found or failed to load.</p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try again
          </Button>
          <Button asChild size="sm">
            <Link href={`/orgs/${orgId}/projects/${projectId}`}>
              Back to project
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TaskDetailLoaded
      key={task._id}
      task={task}
      orgId={orgId}
      projectId={projectId}
      taskId={taskId}
      members={members}
      isAdmin={isAdmin}
    />
  );
}
