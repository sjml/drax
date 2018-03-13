import { Component, OnInit } from '@angular/core';
import { trigger, transition, animate, style, state } from '@angular/animations';

import { Notification, NotificationLevel, NotificationComponentInterface } from '../notification';
import { NotificationService } from '../notification.service';


@Component({
  selector: 'app-notification-container',
  templateUrl: './notification-container.component.html',
  styleUrls: ['./notification-container.component.scss'],
  animations: [
    trigger('notificationState', [
      transition('void => *', [
        style({
          transform: 'translateY(50px)',
          opacity: 0
        }),
        animate(500)
      ]),
      transition('* => void', [
        animate(500, style({
          transform: 'translateX(100%)',
          opacity: 0
        }))
      ])
    ])
  ]
})
export class NotificationContainerComponent implements OnInit, NotificationComponentInterface {

  notifications: Notification[] = [];

  constructor(
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.notificationService.registerComponent(this);
  }

  add(notification: Notification, duration: number) {
    if (this.notifications.includes(notification)) {
      console.error('Notification already inserted.');
      return;
    }

    if (duration > 0) {
      notification['timeout'] = setTimeout(() => {
        this.remove(notification);
      }, duration);
    }
    this.notifications.push(notification);
  }

  remove(notification: Notification) {
    if (!this.notifications.includes(notification)) {
      console.error('Trying to remove notification that is not inserted.');
      return;
    }

    if (notification['timeout']) {
      clearTimeout(notification['timeout']);
      notification['timeout'] = null;
    }
    this.notifications.splice(this.notifications.indexOf(notification), 1);
  }

  pauseTimeout(notification: Notification) {
    if (notification['timeout']) {
      console.log('pausing timeout');
      clearTimeout(notification['timeout']);
      notification['timeout'] = null;
    }
  }

  resumeTimeout(notification: Notification) {
    if (!notification['timeout']) {
      console.log('resuming timeout');
      notification['timeout'] = setTimeout(() => {
        this.remove(notification);
      }, 1000);
    }
  }

  fakeNotify() {
    const n = new Notification();
    n.type = NotificationLevel.Warning;
    n.title = 'Something Odd';
    n.text = 'This is a notification of something odd having happened, that the user maybe needs to know about. ';

    const n2 = new Notification();
    n2.type = NotificationLevel.Error;
    n2.title = 'Something Bad';
    n2.text = 'Something has gone seriously wrong.';

    const n3 = new Notification();
    n3.type = NotificationLevel.Info;
    n3.title = 'Something Normal';
    n3.text = 'Just a regular occurrence we want you to know about.';

    setTimeout(() => {
      this.add(n, 5000);
    }, 3000);
    setTimeout(() => {
      this.add(n2, 5000);
      this.add(n3, 4000);
    }, 3500);
  }

}
