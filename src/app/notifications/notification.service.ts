import { Injectable } from '@angular/core';

import { Notification, NotificationType, NotificationComponentInterface } from './notification';

@Injectable()
export class NotificationService {

  private comp: NotificationComponentInterface = null;

  constructor() { }

  registerComponent(comp: NotificationComponentInterface) {
    this.comp = comp;
  }

  notify(title: string, text: string, timing: number = 3250, type: NotificationType = NotificationType.Info) {
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

}
