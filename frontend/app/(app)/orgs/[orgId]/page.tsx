"use client";

import React, { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";
import { activityApi } from "@/lib/api/activity";
import { projectsApi } from "@/lib/api/projects";
import { organizationsApi } from "@/lib/api/organizations";
import { formatRelativeTime } from "@/lib/format";
import type { TaskStatus } from "@/lib/types";
import { StatusDot } from "@/components/shared/status-dot";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const ALL_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export default function OrgDashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);

  const { data: orgs } = useQuery({
    queryKey: ["orgs"],
    queryFn: organizationsApi.getOrganizations,
    staleTime: 30 * 1000,
  });

  const org = orgs?.find((o) => o._id === orgId);

  const {
    data: dashboard,
    isLoading: isDashLoading,
    isError: isDashError,
    refetch: refetchDash,
  } = useQuery({
    queryKey: ["org", orgId, "dashboard"],
    queryFn: () => dashboardApi.getDashboard(orgId),
    staleTime: 30 * 1000,
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ["org", orgId, "activity", 1],
    queryFn: () => activityApi.getActivity(orgId, 1, 8),
    staleTime: 30 * 1000,
  });

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["org", orgId, "projects"],
    queryFn: () => projectsApi.getProjects(orgId),
    staleTime: 30 * 1000,
  });

  // Calculate status counts (missing statuses default to 0)
  const breakdownMap = new Map<TaskStatus, number>();
  ALL_STATUSES.forEach((s) => breakdownMap.set(s, 0));
  dashboard?.breakdown?.forEach((b) => {
    breakdownMap.set(b._id, b.count);
  });

  const total = dashboard?.totalTasks || 0;

  const renderActivityText = (actorName: string, message: string) => {
    if (message.startsWith(actorName)) {
      return message;
    }
    return `${actorName} ${message}`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {org?.name || "Dashboard"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Overview of organization tasks, progress and activity
        </p>
      </div>

      {/* 5 Plain Bordered Stat Blocks */}
      {isDashLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isDashError ? (
        <div className="rounded-[6px] border border-border p-4 text-center">
          <p className="text-xs text-destructive">Failed to load statistics.</p>
          <Button
            onClick={() => refetchDash()}
            variant="outline"
            size="sm"
            className="mt-2 text-xs"
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-[6px] border border-border bg-background p-3.5">
            <span className="text-xs text-muted-foreground">Total</span>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {dashboard?.totalTasks || 0}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-background p-3.5">
            <span className="text-xs text-muted-foreground">Pending</span>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {dashboard?.pendingTasks || 0}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-background p-3.5">
            <span className="text-xs text-muted-foreground">Completed</span>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {dashboard?.completedTasks || 0}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-background p-3.5">
            <span className="text-xs text-muted-foreground">
              Assigned to me
            </span>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {dashboard?.myAssignedTasks || 0}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-background p-3.5">
            <span className="text-xs text-muted-foreground">Overdue</span>
            <div
              className={`mt-1 text-2xl font-semibold ${
                (dashboard?.overdueTasks || 0) > 0
                  ? "text-[#B91C1C]"
                  : "text-foreground"
              }`}
            >
              {dashboard?.overdueTasks || 0}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Status Breakdown + Recent Activity & Short Projects List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Status Breakdown + Recent Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status Breakdown with thin neutral bars */}
          <div className="rounded-[6px] border border-border bg-background p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Status breakdown
            </h2>
            <div className="space-y-3 pt-1">
              {ALL_STATUSES.map((st) => {
                const count = breakdownMap.get(st) || 0;
                const percentage =
                  total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={st} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <StatusDot status={st} showText={true} />
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    {/* Plain div neutral bar, no chart library */}
                    <div className="h-1.5 w-full rounded-full bg-[#F5F5F5] overflow-hidden">
                      <div
                        className="h-full bg-[#171717]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-[6px] border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Recent activity
              </h2>
              <Link
                href={`/orgs/${orgId}/activity`}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>

            {isActivityLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : !activityData?.activity || activityData.activity.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No recent activity.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {activityData.activity.map((act) => (
                  <div
                    key={act._id}
                    className="flex items-baseline justify-between py-2 text-xs"
                  >
                    <span className="text-foreground pr-2 leading-relaxed">
                      {renderActivityText(act.actorId.name, act.message)}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Short Project List */}
        <div className="space-y-6">
          <div className="rounded-[6px] border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Projects
              </h2>
              <Link
                href={`/orgs/${orgId}/projects`}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>

            {isProjectsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : projects.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No projects yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {projects.slice(0, 6).map((proj) => (
                  <Link
                    key={proj._id}
                    href={`/orgs/${orgId}/projects/${proj._id}`}
                    className="block py-2 text-xs hover:bg-[#F5F5F5] rounded-[4px] px-1.5 -mx-1.5"
                  >
                    <div className="font-medium text-foreground truncate">
                      {proj.name}
                    </div>
                    {proj.description && (
                      <div className="text-muted-foreground truncate mt-0.5">
                        {proj.description}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
