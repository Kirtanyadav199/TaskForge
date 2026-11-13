import { apiFetch } from "./client";
import type { Task, TaskPriority, TaskStatus, Pagination } from "@/lib/types";

export interface GetTasksParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "dueDate";
  sortOrder?: "asc" | "desc";
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  labels?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  labels?: string[];
}

export interface TasksListResponse {
  tasks: Task[];
  pagination: Pagination;
}

export const tasksApi = {
  async getTasks(
    orgId: string,
    projectId: string,
    params: GetTasksParams = {}
  ): Promise<TasksListResponse> {
    const searchParams = new URLSearchParams();

    if (params.status) searchParams.set("status", params.status);
    if (params.priority) searchParams.set("priority", params.priority);
    if (params.assigneeId) searchParams.set("assigneeId", params.assigneeId);
    if (params.search) searchParams.set("search", params.search);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const qs = searchParams.toString();
    const endpoint = `/organizations/${orgId}/projects/${projectId}/tasks${
      qs ? `?${qs}` : ""
    }`;

    const res = await apiFetch<Task[]>(endpoint);
    return {
      tasks: res.data,
      pagination: res.pagination || {
        page: params.page || 1,
        limit: params.limit || 20,
        totalCount: res.data.length,
        totalPages: 1,
      },
    };
  },

  async getTask(
    orgId: string,
    projectId: string,
    taskId: string
  ): Promise<Task> {
    const res = await apiFetch<Task>(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`
    );
    return res.data;
  },

  async createTask(
    orgId: string,
    projectId: string,
    input: CreateTaskInput
  ): Promise<Task> {
    const res = await apiFetch<Task>(
      `/organizations/${orgId}/projects/${projectId}/tasks`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    return res.data;
  },

  async updateTask(
    orgId: string,
    projectId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<Task> {
    const res = await apiFetch<Task>(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      }
    );
    return res.data;
  },

  async deleteTask(
    orgId: string,
    projectId: string,
    taskId: string
  ): Promise<void> {
    await apiFetch<void>(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`,
      {
        method: "DELETE",
      }
    );
  },
};
