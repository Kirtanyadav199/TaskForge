import { apiFetch } from "./client";
import type { Activity, Pagination } from "@/lib/types";

export interface ActivityListResponse {
  activity: Activity[];
  pagination: Pagination;
}

export const activityApi = {
  async getActivity(
    orgId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ActivityListResponse> {
    const res = await apiFetch<Activity[]>(
      `/organizations/${orgId}/activity?page=${page}&limit=${limit}`
    );
    return {
      activity: res.data,
      pagination: res.pagination || {
        page,
        limit,
        totalCount: res.data.length,
        totalPages: 1,
      },
    };
  },
};
