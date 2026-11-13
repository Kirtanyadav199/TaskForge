"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsApi } from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getNotifications,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to mark notification as read";
      toast.error(msg);
    },
  });

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markReadMutation.mutate(notificationId);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Updates and task assignments across your projects
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {unreadCount} unread
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-[6px] border border-border p-6 text-center">
          <p className="text-xs text-destructive">Failed to load notifications.</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-[6px] border border-border p-8 text-center text-sm text-muted-foreground">
          No notifications yet.
        </div>
      ) : (
        <div className="rounded-[6px] border border-border bg-background divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n._id, n.isRead)}
              className={`flex cursor-pointer items-center justify-between p-3.5 text-xs transition-colors hover:bg-[#F5F5F5] ${
                !n.isRead ? "bg-[#FAFAFA]" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                {/* Unread indicator dot */}
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    !n.isRead ? "bg-[#2563EB]" : "bg-transparent"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`truncate leading-relaxed ${
                    !n.isRead
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {n.message}
                </span>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatRelativeTime(n.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
