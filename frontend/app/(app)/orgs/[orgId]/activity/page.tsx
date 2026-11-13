"use client";

import React, { use, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { activityApi } from "@/lib/api/activity";
import { formatRelativeTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function ActivityContent({ orgId }: { orgId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;

  const {
    data: activityData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["org", orgId, "activity", page],
    queryFn: () => activityApi.getActivity(orgId, page, limit),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const renderActivityText = (actorName: string, message: string) => {
    if (message.startsWith(actorName)) {
      return message;
    }
    return `${actorName} ${message}`;
  };

  const activities = activityData?.activity || [];
  const pagination = activityData?.pagination || {
    page: 1,
    limit,
    totalCount: 0,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Activity
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Audit log of events and updates in this organization
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-[6px] border border-border p-6 text-center">
          <p className="text-xs text-destructive">Failed to load activity log.</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-[6px] border border-border p-8 text-center text-sm text-muted-foreground">
          No activity recorded yet.
        </div>
      ) : (
        <div className="rounded-[6px] border border-border bg-background divide-y divide-border">
          {activities.map((act) => (
            <div
              key={act._id}
              className="flex items-baseline justify-between p-3.5 text-xs hover:bg-[#F5F5F5]"
            >
              <div className="leading-relaxed text-foreground pr-4">
                {renderActivityText(act.actorId.name, act.message)}
              </div>
              <span className="shrink-0 text-muted-foreground text-[11px]">
                {formatRelativeTime(act.createdAt)}
              </span>
            </div>
          ))}

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
            <div>
              Page {pagination.page} of {pagination.totalPages || 1} (
              {pagination.totalCount} events)
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

export default function ActivityPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ActivityContent orgId={orgId} />
    </Suspense>
  );
}
