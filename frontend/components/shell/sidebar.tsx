"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Activity as ActivityIcon,
  Settings as SettingsIcon,
  Bell,
  LogOut,
  MoreVertical,
} from "lucide-react";
import { OrgSwitcher } from "./org-switcher";
import { useAuth } from "@/lib/auth/auth-context";
import { useOrgRole } from "@/lib/hooks/use-org-role";
import { notificationsApi } from "@/lib/api/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentOrgId?: string;
  onNavigate?: () => void;
}

export function Sidebar({ currentOrgId, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isOwner } = useOrgRole(currentOrgId);

  // Poll notifications every 60s
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getNotifications,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });

  const unreadCount =
    notifications?.filter((n) => !n.isRead).length ?? 0;

  const navItems = currentOrgId
    ? [
        {
          label: "Dashboard",
          href: `/orgs/${currentOrgId}`,
          icon: LayoutDashboard,
          exact: true,
        },
        {
          label: "Projects",
          href: `/orgs/${currentOrgId}/projects`,
          icon: FolderKanban,
          exact: false,
        },
        {
          label: "Members",
          href: `/orgs/${currentOrgId}/members`,
          icon: Users,
          exact: false,
        },
        {
          label: "Activity",
          href: `/orgs/${currentOrgId}/activity`,
          icon: ActivityIcon,
          exact: false,
        },
        ...(isOwner
          ? [
              {
                label: "Settings",
                href: `/orgs/${currentOrgId}/settings`,
                icon: SettingsIcon,
                exact: false,
              },
            ]
          : []),
      ]
    : [];

  const isNotificationsActive = pathname === "/notifications";

  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-border bg-[#FAFAFA] text-foreground">
      {/* Top org switcher */}
      <div className="p-3 border-b border-border">
        <OrgSwitcher currentOrgId={currentOrgId} onSelect={onNavigate} />
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-sm font-normal text-muted-foreground hover:bg-[#F5F5F5] hover:text-foreground",
                isActive && "bg-[#F5F5F5] font-medium text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 text-muted-foreground",
                  isActive && "text-[#2563eb]"
                )}
                strokeWidth={1.75}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: notifications and user menu */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/notifications"
          onClick={onNavigate}
          className={cn(
            "flex items-center justify-between rounded-[6px] px-2.5 py-1.5 text-sm font-normal text-muted-foreground hover:bg-[#F5F5F5] hover:text-foreground",
            isNotificationsActive && "bg-[#F5F5F5] font-medium text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Bell
              className={cn(
                "size-4 shrink-0 text-muted-foreground",
                isNotificationsActive && "text-[#2563eb]"
              )}
              strokeWidth={1.75}
            />
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563eb] px-1 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-[6px] px-2.5 py-1.5 text-left text-sm text-muted-foreground hover:bg-[#F5F5F5] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <div className="truncate">
                <div className="truncate text-xs font-medium text-foreground">
                  {user?.name || "User"}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {user?.email}
                </div>
              </div>
              <MoreVertical className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-[200px] rounded-[6px] border border-border bg-background p-1 text-sm shadow-xs"
          >
            <DropdownMenuItem
              onClick={() => logout()}
              className="flex cursor-pointer items-center gap-1.5 rounded-[4px] px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-3.5 shrink-0" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
