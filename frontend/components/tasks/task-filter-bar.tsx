"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { Member } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFilterBarProps {
  members: Member[];
}

export function TaskFilterBar({ members }: TaskFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL search params
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "all";
  const currentPriority = searchParams.get("priority") || "all";
  const currentAssignee = searchParams.get("assigneeId") || "all";
  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

  // Compute composite sort key
  const currentSortKey =
    currentSortBy === "dueDate"
      ? currentSortOrder === "asc"
        ? "due_asc"
        : "due_desc"
      : currentSortOrder === "asc"
      ? "created_asc"
      : "created_desc";

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSortChange = (sortKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortKey === "created_asc") {
      params.set("sortBy", "createdAt");
      params.set("sortOrder", "asc");
    } else if (sortKey === "due_asc") {
      params.set("sortBy", "dueDate");
      params.set("sortOrder", "asc");
    } else if (sortKey === "due_desc") {
      params.set("sortBy", "dueDate");
      params.set("sortOrder", "desc");
    } else {
      // default: created_desc
      params.set("sortBy", "createdAt");
      params.set("sortOrder", "desc");
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchTerm("");
    router.replace(pathname);
  };

  // Sync debounced search with URL
  useEffect(() => {
    if (debouncedSearch !== currentSearch) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [debouncedSearch, currentSearch, pathname, router, searchParams]);

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentStatus !== "all" ||
    currentPriority !== "all" ||
    currentAssignee !== "all" ||
    currentSortKey !== "created_desc";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search Input */}
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tasks…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 pl-8 text-xs"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={currentStatus}
        onValueChange={(val) => updateParam("status", val)}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="TODO">Todo</SelectItem>
          <SelectItem value="IN_PROGRESS">In progress</SelectItem>
          <SelectItem value="REVIEW">Review</SelectItem>
          <SelectItem value="DONE">Done</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select
        value={currentPriority}
        onValueChange={(val) => updateParam("priority", val)}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="URGENT">Urgent</SelectItem>
        </SelectContent>
      </Select>

      {/* Assignee Filter */}
      <Select
        value={currentAssignee}
        onValueChange={(val) => updateParam("assigneeId", val)}
      >
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
          <SelectItem value="all">All assignees</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.userId._id} value={m.userId._id}>
              {m.userId.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort Selector */}
      <Select value={currentSortKey} onValueChange={handleSortChange}>
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
          <SelectItem value="created_desc">Newest</SelectItem>
          <SelectItem value="created_asc">Oldest</SelectItem>
          <SelectItem value="due_asc">Due soonest</SelectItem>
          <SelectItem value="due_desc">Due latest</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
          <span>Clear</span>
        </Button>
      )}
    </div>
  );
}
