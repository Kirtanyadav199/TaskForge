"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Menu, ChevronRight } from "lucide-react";
import { organizationsApi } from "@/lib/api/organizations";

interface HeaderProps {
  onOpenMobileNav: () => void;
  currentOrgId?: string;
}

export function Header({ onOpenMobileNav, currentOrgId }: HeaderProps) {
  const pathname = usePathname();

  const { data: orgs } = useQuery({
    queryKey: ["orgs"],
    queryFn: organizationsApi.getOrganizations,
    staleTime: 30 * 1000,
  });

  const currentOrg = orgs?.find((o) => o._id === currentOrgId);

  // Generate simple breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);

  const getBreadcrumbTitle = (segment: string, index: number) => {
    if (segment === "orgs" && index === 0) return null;
    if (segment === currentOrgId) return currentOrg?.name || "Organization";
    if (segment === "projects") return "Projects";
    if (segment === "members") return "Members";
    if (segment === "activity") return "Activity";
    if (segment === "settings") return "Settings";
    if (segment === "notifications") return "Notifications";
    if (segment === "new") return "New organization";
    if (segment === "tasks") return "Tasks";
    // If it's an ID (24-char ObjectId)
    if (segment.length === 24) return "Details";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const breadcrumbs = segments
    .map((seg, idx) => {
      const title = getBreadcrumbTitle(seg, idx);
      if (!title) return null;
      const href = "/" + segments.slice(0, idx + 1).join("/");
      return { title, href };
    })
    .filter(Boolean) as { title: string; href: string }[];

  return (
    <header className="sticky top-0 z-10 flex h-12 w-full items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="flex size-8 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-[#F5F5F5] hover:text-foreground md:hidden focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Menu className="size-4" strokeWidth={1.75} />
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-xs">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.href}>
                {idx > 0 && (
                  <ChevronRight className="size-3 text-muted-foreground" />
                )}
                {isLast ? (
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {crumb.title}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground truncate max-w-[150px]"
                  >
                    {crumb.title}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
