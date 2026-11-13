import { apiFetch } from "./client";
import type { Project } from "@/lib/types";

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export const projectsApi = {
  async getProjects(orgId: string): Promise<Project[]> {
    const res = await apiFetch<Project[]>(`/organizations/${orgId}/projects`);
    return res.data;
  },

  async getProject(orgId: string, projectId: string): Promise<Project> {
    const res = await apiFetch<Project>(
      `/organizations/${orgId}/projects/${projectId}`
    );
    return res.data;
  },

  async createProject(
    orgId: string,
    input: CreateProjectInput
  ): Promise<Project> {
    const res = await apiFetch<Project>(`/organizations/${orgId}/projects`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async updateProject(
    orgId: string,
    projectId: string,
    input: UpdateProjectInput
  ): Promise<Project> {
    const res = await apiFetch<Project>(
      `/organizations/${orgId}/projects/${projectId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      }
    );
    return res.data;
  },

  async deleteProject(orgId: string, projectId: string): Promise<void> {
    await apiFetch<void>(`/organizations/${orgId}/projects/${projectId}`, {
      method: "DELETE",
    });
  },
};
