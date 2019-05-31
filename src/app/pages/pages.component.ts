import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { NotificationService } from '../notifications/notification.service';

import * as MD from 'markdown-it';
import { NotificationLevel } from '../notifications/notification';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent implements OnInit {

  @ViewChild('renderedPage', { static: true }) host: ElementRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      this.loadPage(paramMap.get('pageName'));
    });
  }

  private loadPage(pageName: string) {
    if (pageName) {
      this.http.get(`./assets/pages/${pageName}.md?${Date.now()}`, {responseType: 'text'}).toPromise()
        .then((response) => {
          const md = MD('default', {
            html: true,
            typographer: true
          });
          const html = md.render(response);
          this.host.nativeElement.innerHTML = html;
          // TODO: figure out if we can be more precise and do this
          //       to just a single element instead of the whole window
          window.scrollTo(0, 0);
        })
        .catch((err) => {
          this.notificationService.notify(
            'No Such Page',
            `Couldn\'t load page "${pageName}."`,
            2000,
            NotificationLevel.Error
          );
          this.router.navigateByUrl('/');
        })
      ;
    }
    else {
      this.notificationService.notify(
        'No Such Page',
        'Couldn\'t load page.',
        2000,
        NotificationLevel.Error
      );
      this.router.navigateByUrl('/');
    }
  }

}
