import { z } from "zod";

export const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]).default("member"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export type AddMemberInput = z.infer<typeof addMemberSchema>;