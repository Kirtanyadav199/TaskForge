"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { organizationsApi } from "@/lib/api/organizations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

const newOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required").trim(),
});

type NewOrgFormValues = z.infer<typeof newOrgSchema>;

export default function NewOrganizationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewOrgFormValues>({
    resolver: zodResolver(newOrgSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: NewOrgFormValues) => {
    setServerError(null);
    try {
      const org = await organizationsApi.createOrganization(values);
      if (typeof window !== "undefined") {
        localStorage.setItem("taskforge_last_org_id", org._id);
      }
      await queryClient.invalidateQueries({ queryKey: ["orgs"] });
      router.push(`/orgs/${org._id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Could not create organization. Try again.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-[420px] py-12">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Create organization
          </h1>
          <p className="text-xs text-muted-foreground">
            Organizations group projects, members and tasks together
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">
              Organization name
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="organization"
              placeholder="Acme Corp"
              disabled={isSubmitting}
              {...register("name")}
              className="h-9 text-sm"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 text-sm font-medium"
            >
              {isSubmitting ? "Saving…" : "Create organization"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
