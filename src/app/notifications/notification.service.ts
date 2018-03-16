import { Injectable } from '@angular/core';

import { Notification, NotificationLevel, NotificationComponentInterface } from './notification';

@Injectable()
export class NotificationService {

  private comp: NotificationComponentInterface = null;

  constructor() { }

  registerComponent(comp: NotificationComponentInterface) {
    this.comp = comp;
  }

  notify(title: string, text: string, timing: number = 3250, type: NotificationLevel = NotificationLevel.Info) {
    if (this.comp == null) {
      console.error('No notification container.');
      return;
    }
    const n = new Notification();
    n.title = title;
    n.text = text;
    n.type = type;
    this.comp.add(n, timing);
  }

  push(notification: Notification, timing: number) {
    this.comp.add(notification, timing);
  }

  // TODO: make this some kind of enum
  clearNotifications(title: string) {
    this.comp.clearNotifications(title);
  }
}
