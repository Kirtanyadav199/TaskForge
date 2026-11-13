"use client";

import { useQuery } from "@tanstack/react-query";
import { membersApi } from "@/lib/api/members";
import { useAuth } from "@/lib/auth/auth-context";
import type { Role } from "@/lib/types";

export function useOrgRole(orgId?: string) {
  const { user } = useAuth();

  const { data: members, isLoading } = useQuery({
    queryKey: ["org", orgId, "members"],
    queryFn: () => (orgId ? membersApi.getMembers(orgId) : Promise.resolve([])),
    enabled: Boolean(orgId && user?.id),
    staleTime: 30 * 1000,
  });

  const membership = members?.find((m) => m.userId?._id === user?.id);
  const role: Role | null = membership?.role ?? null;

  return {
    role,
    isOwner: role === "owner",
    isAdmin: role === "admin" || role === "owner",
    isMember: Boolean(role),
    isLoading,
  };
}
