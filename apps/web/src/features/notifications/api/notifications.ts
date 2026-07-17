import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata: any;
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const getNotifications = async (unreadOnly = false, limit = 20): Promise<GetNotificationsResponse> => {
  return apiClient.get<GetNotificationsResponse>(
    `${ENDPOINTS.NOTIFICATIONS.LIST}?unreadOnly=${unreadOnly}&limit=${limit}`
  );
};

export const markAsRead = async (id: string): Promise<{ success: boolean }> => {
  return apiClient.patch<{ success: boolean }>(ENDPOINTS.NOTIFICATIONS.READ(id));
};

export const markAllAsRead = async (): Promise<{ success: boolean }> => {
  return apiClient.patch<{ success: boolean }>(ENDPOINTS.NOTIFICATIONS.READ_ALL);
};
