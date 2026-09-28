import { z } from "zod";

export const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]).default("member"),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;