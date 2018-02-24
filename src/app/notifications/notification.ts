export enum NotificationType {
  Info = 'info', Warning = 'warning', Error = 'error'
}

export class Notification {
  type: NotificationType;
  title: string = null;
  text: string = null;
}

export interface NotificationComponentInterface {
  add(notification: Notification, duration: number);
}
