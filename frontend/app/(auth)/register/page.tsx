"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerAuth(values);
      router.replace("/orgs/new");
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Could not register. Try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-xs text-muted-foreground">
          Enter your details to get started with TaskForge
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
            Full name
          </Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            disabled={isSubmitting}
            {...register("name")}
            className="h-9 text-sm"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            disabled={isSubmitting}
            {...register("email")}
            className="h-9 text-sm"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            disabled={isSubmitting}
            {...register("password")}
            className="h-9 text-sm"
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-9 text-sm font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Register"}
        </Button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground underline underline-offset-4 hover:text-[#2563eb]"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
