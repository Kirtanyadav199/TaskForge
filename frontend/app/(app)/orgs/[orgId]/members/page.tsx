"use client";

import React, { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Trash2 } from "lucide-react";
import { membersApi } from "@/lib/api/members";
import { useAuth } from "@/lib/auth/auth-context";
import { useOrgRole } from "@/lib/hooks/use-org-role";
import { ApiError } from "@/lib/api/client";
import type { Member, Role } from "@/lib/types";
import { AddMemberDialog } from "@/components/members/add-member-dialog";
import { RemoveMemberDialog } from "@/components/members/remove-member-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const { user } = useAuth();
  const { isOwner, isAdmin } = useOrgRole(orgId);
  const queryClient = useQueryClient();

  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<{
    member: Member;
    isSelf: boolean;
  } | null>(null);

  const {
    data: members,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["org", orgId, "members"],
    queryFn: () => membersApi.getMembers(orgId),
    staleTime: 30 * 1000,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "member";
    }) => membersApi.updateMemberRole(orgId, userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "members"] });
      toast.success("Role updated");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to update role";
      toast.error(msg);
    },
  });

  const handleRoleChange = (userId: string, newRole: Role) => {
    if (newRole === "owner") return;
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const currentMember = members?.find((m) => m.userId?._id === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Members
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage who has access to this organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentMember && currentMember.role !== "owner" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedMemberToRemove({
                  member: currentMember,
                  isSelf: true,
                })
              }
              className="gap-1.5 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              <span>Leave organization</span>
            </Button>
          )}
          {isAdmin && <AddMemberDialog orgId={orgId} />}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-[6px] border border-border p-6 text-center">
          <p className="text-xs text-destructive">Failed to load members.</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      ) : !members || members.length === 0 ? (
        <div className="rounded-[6px] border border-border p-8 text-center text-sm text-muted-foreground">
          No members found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[6px] border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-[#FAFAFA] text-xs font-medium text-muted-foreground">
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => {
                const isCurrentUser = member.userId._id === user?.id;
                const isMemberOwner = member.role === "owner";
                const isMemberAdmin = member.role === "admin";

                // Can current user remove this member?
                // Owner can remove anyone except self (owner cannot leave/be removed).
                // Admin can remove normal members only (not admins, not owner).
                const canRemove =
                  !isMemberOwner &&
                  !isCurrentUser &&
                  (isOwner || (isAdmin && !isMemberAdmin));

                return (
                  <tr key={member._id} className="hover:bg-[#F5F5F5]">
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{member.userId.name}</span>
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {member.userId.email}
                    </td>
                    <td className="py-3 px-4">
                      {isOwner && !isMemberOwner ? (
                        <div className="w-28">
                          <Select
                            value={member.role}
                            onValueChange={(val: "admin" | "member") =>
                              handleRoleChange(member.userId._id, val)
                            }
                            disabled={updateRoleMutation.isPending}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="text-xs capitalize text-muted-foreground">
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canRemove ? (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() =>
                            setSelectedMemberToRemove({
                              member,
                              isSelf: false,
                            })
                          }
                          aria-label="Remove member"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : isCurrentUser && !isMemberOwner ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            setSelectedMemberToRemove({
                              member,
                              isSelf: true,
                            })
                          }
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          Leave
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Remove / Leave member dialog */}
      <RemoveMemberDialog
        orgId={orgId}
        member={selectedMemberToRemove?.member || null}
        isSelf={selectedMemberToRemove?.isSelf || false}
        open={Boolean(selectedMemberToRemove)}
        onOpenChange={(open) => {
          if (!open) setSelectedMemberToRemove(null);
        }}
      />
    </div>
  );
}
