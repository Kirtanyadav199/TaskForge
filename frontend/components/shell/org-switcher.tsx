"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { organizationsApi } from "@/lib/api/organizations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface OrgSwitcherProps {
  currentOrgId?: string;
  onSelect?: () => void;
}

export function OrgSwitcher({ currentOrgId, onSelect }: OrgSwitcherProps) {
  const router = useRouter();

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: organizationsApi.getOrganizations,
    staleTime: 30 * 1000,
  });

  const currentOrg = orgs?.find((o) => o._id === currentOrgId);

  const handleSelectOrg = (orgId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("taskforge_last_org_id", orgId);
    }
    router.push(`/orgs/${orgId}`);
    onSelect?.();
  };

  const handleNewOrg = () => {
    router.push("/orgs/new");
    onSelect?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Select organization"
          className="flex h-9 w-full items-center justify-between rounded-[6px] border border-border bg-background px-2.5 text-left text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span className="truncate">
            {isLoading
              ? "Loading…"
              : currentOrg?.name || "Select organization"}
          </span>
          <ChevronsUpDown className="ml-1.5 size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[216px] rounded-[6px] border border-border bg-background p-1 text-sm shadow-xs"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        {orgs && orgs.length > 0 ? (
          orgs.map((org) => {
            const isSelected = org._id === currentOrgId;
            return (
              <DropdownMenuItem
                key={org._id}
                onClick={() => handleSelectOrg(org._id)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-[4px] px-2 py-1.5 text-sm",
                  isSelected && "font-medium text-[#2563eb]"
                )}
              >
                <span className="truncate">{org.name}</span>
                {isSelected && <Check className="size-3.5 shrink-0" />}
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            No organizations found
          </div>
        )}
        <DropdownMenuSeparator className="my-1 bg-border" />
        <DropdownMenuItem
          onClick={handleNewOrg}
          className="flex cursor-pointer items-center gap-1.5 rounded-[4px] px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5 shrink-0" />
          <span>New organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
