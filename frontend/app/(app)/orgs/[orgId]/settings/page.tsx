"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { organizationsApi } from "@/lib/api/organizations";
import { useOrgRole } from "@/lib/hooks/use-org-role";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const renameSchema = z.object({
  name: z.string().min(1, "Organization name is required").trim(),
});

type RenameFormValues = z.infer<typeof renameSchema>;

export default function OrgSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOwner, isLoading: isRoleLoading } = useOrgRole(orgId);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmNameInput, setConfirmNameInput] = useState("");

  const { data: orgs, isLoading: isOrgsLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: organizationsApi.getOrganizations,
    staleTime: 30 * 1000,
  });

  const org = orgs?.find((o) => o._id === orgId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RenameFormValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: {
      name: org?.name || "",
    },
  });

  useEffect(() => {
    if (org) {
      reset({ name: org.name });
    }
  }, [org, reset]);

  const renameMutation = useMutation({
    mutationFn: (values: RenameFormValues) =>
      organizationsApi.updateOrganization(orgId, { name: values.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      toast.success("Organization renamed");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to rename organization";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => organizationsApi.deleteOrganization(orgId),
    onSuccess: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("taskforge_last_org_id");
      }
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      toast.success("Organization deleted");
      setShowDeleteModal(false);
      router.replace("/");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to delete organization";
      toast.error(msg);
    },
  });

  const onRenameSubmit = (values: RenameFormValues) => {
    renameMutation.mutate(values);
  };

  if (isRoleLoading || isOrgsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Hide UI if not owner
  if (!isOwner) {
    return (
      <div className="rounded-[6px] border border-border p-8 text-center space-y-2">
        <h2 className="text-base font-semibold text-foreground">
          Access restricted
        </h2>
        <p className="text-xs text-muted-foreground">
          Only the organization owner can manage organization settings.
        </p>
      </div>
    );
  }

  const isConfirmMatch = org?.name && confirmNameInput.trim() === org.name;

  return (
    <div className="max-w-[640px] space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage general organization preferences and ownership
        </p>
      </div>

      {/* Rename Organization Form */}
      <div className="rounded-[6px] border border-border bg-background p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            General
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            The display name of this organization across TaskForge
          </p>
        </div>

        <form onSubmit={handleSubmit(onRenameSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="org-name" className="text-xs font-medium">
              Organization name
            </Label>
            <Input
              id="org-name"
              type="text"
              disabled={isSubmitting || renameMutation.isPending}
              {...register("name")}
              className="h-9 text-sm max-w-sm"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-start">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || renameMutation.isPending}
            >
              {renameMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Delete Organization */}
      <div className="rounded-[6px] border border-destructive/20 bg-background p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-destructive">
            Danger zone
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permanently delete this organization. This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Once deleted, this organization and its access settings will be removed.
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setConfirmNameInput("");
              setShowDeleteModal(true);
            }}
          >
            Delete organization
          </Button>
        </div>
      </div>

      {/* Delete Organization AlertDialog with Name Confirmation */}
      <AlertDialog
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      >
        <AlertDialogContent className="max-w-[420px] rounded-[6px] border border-border p-6 shadow-xs">
          <AlertDialogHeader className="gap-1.5 text-left">
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Delete organization
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{org?.name}</strong>? Please type the organization name to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5 py-2">
            <Label htmlFor="confirm-name" className="text-xs text-muted-foreground">
              Type <span className="font-mono text-foreground">{org?.name}</span>
            </Label>
            <Input
              id="confirm-name"
              type="text"
              value={confirmNameInput}
              onChange={(e) => setConfirmNameInput(e.target.value)}
              placeholder={org?.name}
              className="h-8 text-xs font-mono"
            />
          </div>

          <AlertDialogFooter className="mt-3 gap-2 sm:justify-end">
            <AlertDialogCancel
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              disabled={!isConfirmMatch || deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? "Saving…" : "Delete organization"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
