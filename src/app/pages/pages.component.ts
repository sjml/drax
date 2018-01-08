import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import * as MD from 'markdown-it';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent implements OnInit {

  @ViewChild('renderedPage') host: ElementRef;

  private _pageName: string = null;
  @Input() set pageName(v: string) {
    if (v !== this._pageName) {
      this._pageName = v;
      this.loadPage();
    }
  }
  get pageName(): string { return this._pageName; }

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.loadPage();
  }

  private loadPage() {
    if (this._pageName !== null) {
      this.http.get(`./assets/pages/${this._pageName}.md`, {responseType: 'text'}).toPromise()
        .then((response) => {
          const md = MD('default', {
            html: true,
            typographer: true
          });
          const html = md.render(response);
          console.log(html);
          this.host.nativeElement.innerHTML = html;
          // TODO: figure out if we can be more precise and do this
          //       to just a single element instead of the whole window
          window.scrollTo(0, 0);
        })
        .catch((err) => {
          // redirect to base
          console.error(err);
          this.router.navigateByUrl('/');
        })
      ;
    }
    else {
      this.host.nativeElement.innerHTML = '';
    }
  }

}
