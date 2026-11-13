"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { projectsApi } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";
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

const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface CreateProjectDialogProps {
  orgId: string;
}

export function CreateProjectDialog({ orgId }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ProjectFormValues) =>
      projectsApi.createProject(orgId, {
        name: values.name,
        description: values.description ? values.description.trim() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "projects"] });
      toast.success("Project created");
      reset();
      setServerError(null);
      setOpen(false);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to create project";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (values: ProjectFormValues) => {
    setServerError(null);
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" strokeWidth={1.75} />
          <span>New project</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[420px] rounded-[6px] border border-border p-6 shadow-xs">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-semibold text-foreground">
            New project
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {serverError && (
            <div className="border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="project-name" className="text-xs font-medium">
              Project name
            </Label>
            <Input
              id="project-name"
              type="text"
              placeholder="e.g. Mobile App"
              disabled={mutation.isPending}
              {...register("name")}
              className="h-9 text-sm"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-desc" className="text-xs font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="project-desc"
              placeholder="Brief description of the project"
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
              onClick={() => {
                reset();
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
              {mutation.isPending ? "Saving…" : "Create project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
