import { apiFetch } from "./client";
import type { Comment } from "@/lib/types";

export interface CreateCommentInput {
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}

export const commentsApi = {
  async getComments(
    orgId: string,
    projectId: string,
    taskId: string
  ): Promise<Comment[]> {
    const res = await apiFetch<Comment[]>(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments`
    );
    return res.data;
  },

  async createComment(
    orgId: string,
    projectId: string,
    taskId: string,
    input: CreateCommentInput
  ): Promise<void> {
    await apiFetch<unknown>(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },

  async updateComment(
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    input: UpdateCommentInput
  ): Promise<Comment> {
    const res = await apiFetch<Comment>(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      }
    );
    return res.data;
  },

  async deleteComment(
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string
  ): Promise<void> {
    await apiFetch<void>(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
      {
        method: "DELETE",
      }
    );
  },
};
