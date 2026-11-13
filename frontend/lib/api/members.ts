import { apiFetch } from "./client";
import type { Member } from "@/lib/types";

export interface AddMemberInput {
  email: string;
  role: "admin" | "member";
}

export interface UpdateRoleInput {
  role: "admin" | "member";
}

export const membersApi = {
  async getMembers(orgId: string): Promise<Member[]> {
    const res = await apiFetch<Member[]>(`/organizations/${orgId}/members`);
    return res.data;
  },

  async addMember(orgId: string, input: AddMemberInput): Promise<Member> {
    const res = await apiFetch<Member>(`/organizations/${orgId}/members`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async updateMemberRole(
    orgId: string,
    userId: string,
    input: UpdateRoleInput
  ): Promise<Member> {
    const res = await apiFetch<Member>(
      `/organizations/${orgId}/members/${userId}/role`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      }
    );
    return res.data;
  },

  async removeMember(orgId: string, userId: string): Promise<void> {
    await apiFetch<void>(`/organizations/${orgId}/members/${userId}`, {
      method: "DELETE",
    });
  },
};
