import { apiFetch } from "./client";
import type { DashboardData } from "@/lib/types";

export const dashboardApi = {
  async getDashboard(orgId: string): Promise<DashboardData> {
    const res = await apiFetch<DashboardData>(`/organizations/${orgId}/dashboard`);
    return res.data;
  },
};
