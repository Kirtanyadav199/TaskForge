import { apiFetch } from "./client";
import type { Notification } from "@/lib/types";

export const notificationsApi = {
  async getNotifications(): Promise<Notification[]> {
    const res = await apiFetch<Notification[]>("/notifications");
    return res.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiFetch<void>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  },
};
