"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectsApi } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";
import type { Project } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const editProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  description: z.string().optional(),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

interface EditProjectFormProps {
  orgId: string;
  project: Project;
  onClose: () => void;
}

function EditProjectForm({ orgId, project, onClose }: EditProjectFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: EditProjectFormValues) =>
      projectsApi.updateProject(orgId, project._id, {
        name: values.name,
        description: values.description ? values.description.trim() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "projects"] });
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "project", project._id],
      });
      toast.success("Project updated");
      onClose();
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to update project";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (values: EditProjectFormValues) => {
    setServerError(null);
    mutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      {serverError && (
        <div className="border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {serverError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="edit-project-name" className="text-xs font-medium">
          Project name
        </Label>
        <Input
          id="edit-project-name"
          type="text"
          disabled={mutation.isPending}
          {...register("name")}
          className="h-9 text-sm"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-project-desc" className="text-xs font-medium">
          Description (optional)
        </Label>
        <Textarea
          id="edit-project-desc"
          rows={3}
          disabled={mutation.isPending}
          {...register("description")}
          className="resize-none text-sm"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={mutation.isPending}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

interface EditProjectDialogProps {
  orgId: string;
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({
  orgId,
  project,
  open,
  onOpenChange,
}: EditProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-[6px] border border-border p-6 shadow-xs">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-semibold text-foreground">
            Edit project
          </DialogTitle>
        </DialogHeader>

        {project && (
          <EditProjectForm
            key={project._id}
            orgId={orgId}
            project={project}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
