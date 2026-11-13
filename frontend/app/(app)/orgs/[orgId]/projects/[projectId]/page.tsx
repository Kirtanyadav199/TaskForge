"use client";

import React, { use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { tasksApi } from "@/lib/api/tasks";
import { membersApi } from "@/lib/api/members";
import { formatDateUTC, isOverdue } from "@/lib/format";
import type { TaskPriority, TaskStatus } from "@/lib/types";
import { TaskFilterBar } from "@/components/tasks/task-filter-bar";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskStatusSelector } from "@/components/tasks/task-status-selector";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function ProjectTasksContent({
  orgId,
  projectId,
}: {
  orgId: string;
  projectId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract filters from URL
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = (searchParams.get("status") || undefined) as
    | TaskStatus
    | undefined;
  const priority = (searchParams.get("priority") || undefined) as
    | TaskPriority
    | undefined;
  const assigneeId = searchParams.get("assigneeId") || undefined;
  const search = searchParams.get("search") || undefined;
  const sortBy = (searchParams.get("sortBy") || "createdAt") as
    | "createdAt"
    | "dueDate";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  const filters = {
    status,
    priority,
    assigneeId,
    search,
    page,
    limit: 20,
    sortBy,
    sortOrder,
  };

  const { data: project } = useQuery({
    queryKey: ["org", orgId, "project", projectId],
    queryFn: () => projectsApi.getProject(orgId, projectId),
    staleTime: 30 * 1000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["org", orgId, "members"],
    queryFn: () => membersApi.getMembers(orgId),
    staleTime: 30 * 1000,
  });

  const {
    data: tasksData,
    isLoading: isTasksLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["org", orgId, "project", projectId, "tasks", filters],
    queryFn: () => tasksApi.getTasks(orgId, projectId, filters),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const memberMap = React.useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => {
      map.set(m.userId._id, m.userId.name);
    });
    return map;
  }, [members]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const tasks = tasksData?.tasks || [];
  const pagination = tasksData?.pagination || {
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-4">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
            {project?.name || "Project tasks"}
          </h1>
          {project?.description ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {project.description}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground italic">
              No description
            </p>
          )}
        </div>
        <CreateTaskDialog
          orgId={orgId}
          projectId={projectId}
          members={members}
        />
      </div>

      {/* Filter bar */}
      <TaskFilterBar members={members} />

      {/* Tasks table / list */}
      {isTasksLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-[6px] border border-border p-6 text-center">
          <p className="text-xs text-destructive">Failed to load tasks.</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState message="No tasks found matching your filters." />
      ) : (
        <div className="overflow-x-auto rounded-[6px] border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-[#FAFAFA] text-xs font-medium text-muted-foreground">
                <th className="py-2.5 px-3 w-32">Status</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3 w-24">Priority</th>
                <th className="py-2.5 px-3 w-32">Assignee</th>
                <th className="py-2.5 px-3 w-28">Due date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => {
                const assigneeName = task.assigneeId
                  ? memberMap.get(task.assigneeId) || "Unknown user"
                  : "Unassigned";
                const overdue = isOverdue(task.dueDate, task.status);

                return (
                  <tr
                    key={task._id}
                    className="hover:bg-[#F5F5F5] group cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/orgs/${orgId}/projects/${projectId}/tasks/${task._id}`
                      )
                    }
                  >
                    {/* Status with optimistic update */}
                    <td
                      className="py-2.5 px-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TaskStatusSelector
                        orgId={orgId}
                        projectId={projectId}
                        task={task}
                      />
                    </td>

                    {/* Title & labels */}
                    <td className="py-2.5 px-3 font-normal text-foreground">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/orgs/${orgId}/projects/${projectId}/tasks/${task._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline hover:text-[#2563EB]"
                        >
                          {task.title}
                        </Link>
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex items-center gap-1">
                            {task.labels.map((label) => (
                              <span
                                key={label}
                                className="rounded-[4px] border border-border px-1.5 py-0.2 text-[11px] text-muted-foreground"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-3">
                      <PriorityBadge priority={task.priority} />
                    </td>

                    {/* Assignee */}
                    <td className="py-2.5 px-3 text-xs text-muted-foreground truncate">
                      {assigneeName}
                    </td>

                    {/* Due date */}
                    <td className="py-2.5 px-3 text-xs">
                      {task.dueDate ? (
                        <span
                          className={
                            overdue
                              ? "text-[#B91C1C] font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {formatDateUTC(task.dueDate)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <div>
              Page {pagination.page} of {pagination.totalPages || 1} (
              {pagination.totalCount}{" "}
              {pagination.totalCount === 1 ? "task" : "tasks"})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="h-7 px-2.5 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="h-7 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectTasksPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ProjectTasksContent orgId={orgId} projectId={projectId} />
    </Suspense>
  );
}
