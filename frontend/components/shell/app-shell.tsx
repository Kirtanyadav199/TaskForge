"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const params = useParams();
  const currentOrgId = typeof params?.orgId === "string" ? params.orgId : undefined;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar currentOrgId={currentOrgId} />
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[240px] border-r border-border bg-[#FAFAFA]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            currentOrgId={currentOrgId}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          currentOrgId={currentOrgId}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1100px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
