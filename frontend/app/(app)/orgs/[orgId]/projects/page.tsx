"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { projectsApi } from "@/lib/api/projects";
import { useOrgRole } from "@/lib/hooks/use-org-role";
import { formatDateUTC } from "@/lib/format";
import type { Project } from "@/lib/types";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjectsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();
  const { isAdmin } = useOrgRole(orgId);

  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  const {
    data: projects,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["org", orgId, "projects"],
    queryFn: () => projectsApi.getProjects(orgId),
    staleTime: 30 * 1000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-xs text-muted-foreground">
            Organize tasks and collaborate with your team
          </p>
        </div>
        <CreateProjectDialog orgId={orgId} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-[6px] border border-border p-6 text-center">
          <p className="text-xs text-destructive">Failed to load projects.</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      ) : !projects || projects.length === 0 ? (
        <EmptyState message="No projects in this organization yet." />
      ) : (
        <div className="divide-y divide-border rounded-[6px] border border-border bg-background">
          {projects.map((project) => (
            <div
              key={project._id}
              onClick={() => router.push(`/orgs/${orgId}/projects/${project._id}`)}
              className="group flex cursor-pointer items-center justify-between p-4 hover:bg-[#F5F5F5]"
            >
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="truncate text-sm font-medium text-foreground">
                    {project.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDateUTC(project.createdAt)}
                  </span>
                </div>
                {project.description ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {project.description}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground italic">
                    No description
                  </p>
                )}
              </div>

              {isAdmin && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Project actions"
                        className="flex size-7 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <MoreHorizontal className="size-4" strokeWidth={1.75} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-32 rounded-[6px] border border-border bg-background p-1 text-xs shadow-xs"
                    >
                      <DropdownMenuItem
                        onClick={() => setEditProject(project)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-[4px] px-2 py-1.5"
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteProject(project)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-[4px] px-2 py-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <EditProjectDialog
        orgId={orgId}
        project={editProject}
        open={Boolean(editProject)}
        onOpenChange={(open) => {
          if (!open) setEditProject(null);
        }}
      />

      {/* Delete dialog */}
      <DeleteProjectDialog
        orgId={orgId}
        project={deleteProject}
        open={Boolean(deleteProject)}
        onOpenChange={(open) => {
          if (!open) setDeleteProject(null);
        }}
      />
    </div>
  );
}
