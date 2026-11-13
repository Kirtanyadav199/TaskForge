"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { AppShell } from "@/components/shell/app-shell";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isBootstrapping } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isBootstrapping && !user) {
      const fullPath = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      router.replace(`/login?next=${encodeURIComponent(fullPath)}`);
    }
  }, [user, isBootstrapping, router, pathname, searchParams]);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xs text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-xs text-muted-foreground">Loading…</div>
        </div>
      }
    >
      <AuthGuard>{children}</AuthGuard>
    </React.Suspense>
  );
}
