"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { membersApi } from "@/lib/api/members";
import { ApiError } from "@/lib/api/client";
import type { Member } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface RemoveMemberDialogProps {
  orgId: string;
  member: Member | null;
  isSelf: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoveMemberDialog({
  orgId,
  member,
  isSelf,
  open,
  onOpenChange,
}: RemoveMemberDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!member) throw new Error("No member selected");
      return membersApi.removeMember(orgId, member.userId._id);
    },
    onSuccess: () => {
      if (isSelf) {
        queryClient.invalidateQueries({ queryKey: ["orgs"] });
        toast.success("You left the organization");
        onOpenChange(false);
        router.push("/");
      } else {
        queryClient.invalidateQueries({
          queryKey: ["org", orgId, "members"],
        });
        toast.success("Member removed");
        onOpenChange(false);
      }
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : isSelf
          ? "Failed to leave organization"
          : "Failed to remove member";
      toast.error(msg);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] rounded-[6px] border border-border p-6 shadow-xs">
        <AlertDialogHeader className="gap-1.5 text-left">
          <AlertDialogTitle className="text-base font-semibold text-foreground">
            {isSelf ? "Leave organization" : "Remove member"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {isSelf
              ? "Are you sure you want to leave this organization? You will lose access to all its projects and tasks."
              : `Are you sure you want to remove ${member?.userId.name || "this user"} from the organization?`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:justify-end">
          <AlertDialogCancel
            size="sm"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            size="sm"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            {mutation.isPending
              ? "Saving…"
              : isSelf
              ? "Leave organization"
              : "Remove member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
