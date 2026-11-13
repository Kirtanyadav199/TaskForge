"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "@/lib/api/organizations";

export default function RootRedirectPage() {
  const router = useRouter();

  const { data: orgs, isLoading, isError } = useQuery({
    queryKey: ["orgs"],
    queryFn: organizationsApi.getOrganizations,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (isLoading) return;

    if (isError || !orgs || orgs.length === 0) {
      router.replace("/orgs/new");
      return;
    }

    const lastOrgId =
      typeof window !== "undefined"
        ? localStorage.getItem("taskforge_last_org_id")
        : null;

    const matchedOrg = orgs.find((o) => o._id === lastOrgId);
    if (matchedOrg) {
      router.replace(`/orgs/${matchedOrg._id}`);
    } else {
      const firstOrg = orgs[0];
      if (typeof window !== "undefined") {
        localStorage.setItem("taskforge_last_org_id", firstOrg._id);
      }
      router.replace(`/orgs/${firstOrg._id}`);
    }
  }, [orgs, isLoading, isError, router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-xs text-muted-foreground">Redirecting…</div>
    </div>
  );
}
