export interface NotificationGetDTO {
  id: number;
  userId: number;
  message: string;
  creationDate: string;
  read: boolean;
  type: string;
  relatedEntityId: number;
}