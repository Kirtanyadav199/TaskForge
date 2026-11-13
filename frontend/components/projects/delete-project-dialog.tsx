"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectsApi } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";
import type { Project } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface DeleteProjectDialogProps {
  orgId: string;
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteProjectDialog({
  orgId,
  project,
  open,
  onOpenChange,
  onDeleted,
}: DeleteProjectDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!project) throw new Error("No project selected");
      return projectsApi.deleteProject(orgId, project._id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "projects"] });
      toast.success("Project deleted");
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to delete project";
      toast.error(msg);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] rounded-[6px] border border-border p-6 shadow-xs">
        <AlertDialogHeader className="gap-1.5 text-left">
          <AlertDialogTitle className="text-base font-semibold text-foreground">
            Delete project
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to delete {project?.name}? Tasks inside this project will remain in the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:justify-end">
          <AlertDialogCancel
            size="sm"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            size="sm"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            {mutation.isPending ? "Saving…" : "Delete project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
