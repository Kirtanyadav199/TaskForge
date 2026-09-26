import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;