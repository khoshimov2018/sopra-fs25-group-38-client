import { ApiService } from "../apiService";
import { NotificationGetDTO } from "@/types";

export class NotificationService {
  private readonly apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  async getNotificationsForUser(userId: number): Promise<NotificationGetDTO[]> {
    return this.apiService.get<NotificationGetDTO[]>(`/notifications/user/${userId}`);
  }

  async getUnreadNotificationsForUser(userId: number): Promise<NotificationGetDTO[]> {
    return this.apiService.get<NotificationGetDTO[]>(`/notifications/user/${userId}/unread`);
  }

  async markNotificationAsRead(notificationId: number): Promise<NotificationGetDTO> {
    return this.apiService.put<NotificationGetDTO>(`/notifications/${notificationId}/read`, {});
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    return this.apiService.put<void>(`/notifications/user/${userId}/read-all`, {});
  }

  async deleteNotification(notificationId: number): Promise<void> {
    return this.apiService.delete<void>(`/notifications/${notificationId}`);
  }
}