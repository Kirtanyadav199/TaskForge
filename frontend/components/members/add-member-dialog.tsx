"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { membersApi } from "@/lib/api/members";
import { ApiError } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const addMemberSchema = z.object({
  email: z.string().email("Valid email required").trim(),
  role: z.enum(["admin", "member"]),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

interface AddMemberDialogProps {
  orgId: string;
}

export function AddMemberDialog({ orgId }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"admin" | "member">("member");
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: AddMemberFormValues) =>
      membersApi.addMember(orgId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "members"] });
      toast.success("Member added");
      reset();
      setRole("member");
      setServerError(null);
      setOpen(false);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to add member";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (values: AddMemberFormValues) => {
    setServerError(null);
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <UserPlus className="size-4" strokeWidth={1.75} />
          <span>Add member</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[400px] rounded-[6px] border border-border p-6 shadow-xs">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-semibold text-foreground">
            Add member
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {serverError && (
            <div className="border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="member-email" className="text-xs font-medium">
              User email
            </Label>
            <Input
              id="member-email"
              type="email"
              placeholder="user@example.com"
              disabled={mutation.isPending}
              {...register("email")}
              className="h-9 text-sm"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="member-role" className="text-xs font-medium">
              Role
            </Label>
            <Select
              value={role}
              onValueChange={(val: "admin" | "member") => {
                setRole(val);
                setValue("role", val);
              }}
              disabled={mutation.isPending}
            >
              <SelectTrigger id="member-role" className="h-9 w-full text-sm">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="rounded-[6px] border border-border bg-background shadow-xs">
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => {
                reset();
                setRole("member");
                setServerError(null);
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving…" : "Add member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
