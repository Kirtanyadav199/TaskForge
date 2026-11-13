"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error cleanly for debugging
    console.error("Application error:", error);
  }, [error]);

  const is403 =
    error.message?.includes("403") ||
    error.message?.toLowerCase().includes("forbidden") ||
    error.message?.toLowerCase().includes("access");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {is403 ? "Access denied" : "Something went wrong"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {is403
            ? "You don’t have access to this organization."
            : error.message || "An unexpected error occurred."}
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
