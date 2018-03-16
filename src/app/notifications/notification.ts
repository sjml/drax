export enum NotificationLevel {
  Info = 'info', Warning = 'warning', Error = 'error'
}

export class Notification {
  type: NotificationLevel;
  title: string = null;
  text: string = null;
}

export interface NotificationComponentInterface {
  add(notification: Notification, duration: number);
  clearNotifications(title: string);
}
