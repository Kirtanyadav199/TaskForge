"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

function AuthRedirectGuard({ children }: { children: React.ReactNode }) {
  const { user, isBootstrapping } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  useEffect(() => {
    if (!isBootstrapping && user) {
      router.replace(next);
    }
  }, [user, isBootstrapping, router, next]);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xs text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[360px] space-y-6">
        <div className="text-center">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            TaskForge
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-xs text-muted-foreground">Loading…</div>
        </div>
      }
    >
      <AuthRedirectGuard>{children}</AuthRedirectGuard>
    </Suspense>
  );
}
