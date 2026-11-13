import { apiFetch } from "./client";
import type { Organization } from "@/lib/types";

export interface CreateOrganizationInput {
  name: string;
}

export interface UpdateOrganizationInput {
  name: string;
}

export const organizationsApi = {
  async getOrganizations(): Promise<Organization[]> {
    const res = await apiFetch<Organization[]>("/organizations");
    return res.data;
  },

  async createOrganization(
    input: CreateOrganizationInput
  ): Promise<Organization> {
    const res = await apiFetch<Organization>("/organizations", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async updateOrganization(
    orgId: string,
    input: UpdateOrganizationInput
  ): Promise<Organization> {
    const res = await apiFetch<Organization>(`/organizations/${orgId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async deleteOrganization(orgId: string): Promise<void> {
    await apiFetch<void>(`/organizations/${orgId}`, {
      method: "DELETE",
    });
  },
};
