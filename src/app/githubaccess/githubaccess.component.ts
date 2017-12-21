import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

@Component({
  selector: 'app-githubaccess',
  templateUrl: './githubaccess.component.html',
  styleUrls: ['./githubaccess.component.css']
})
export class GitHubAccessComponent implements OnInit {

  GITHUB_URL = 'https://api.github.com/graphql';

  authed = false;
  bearerToken: String = null;
  user: object;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.bearerToken = localStorage.getItem('gitHubBearerToken');
    if (this.bearerToken !== null) {
      this.authed = true;
      this.loadUser();
    }
  }

  attemptAuthorization() {
    const popUpWidth  = 400;
    const popUpHeight = 500;

    let left = (screen.width / 2) - (popUpWidth / 2);
    let top = (screen.height / 2) - (popUpHeight / 2);
    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : (screen as any).left;
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : (screen as any).top;

    const width  = window.innerWidth
                    ? window.innerWidth
                    : document.documentElement.clientWidth
                        ? document.documentElement.clientWidth
                        : screen.width;
    const height = window.innerHeight
                    ? window.innerHeight
                    : document.documentElement.clientHeight
                        ? document.documentElement.clientHeight
                        : screen.height;

    left = ((width / 2)  - (popUpWidth / 2)) + dualScreenLeft;
    top  = ((height / 2) - (popUpHeight / 2)) + dualScreenTop;

    window.addEventListener('message', (event) => {
      if (event.data.status === 'OK') {
        localStorage.setItem('gitHubBearerToken', event.data.code);
        this.bearerToken = event.data.code;
        this.loadUser();
      }
      // TODO: surface an error somehow if the status is not 'OK'
    }, false);

    const popupRef = window.open(
      'http://localhost:4201/auth/',
      'GitHub Authorization',
      'scrollbars=yes,width=' + popUpWidth + ',height=' + popUpHeight + ',top=' + top + ',left=' + left
    );
  }

  loadUser() {
    this.getUserData(this.bearerToken).then(user => {
      this.user = user;
    });
  }

  getUserData(token: String): Promise<Object> {
    return this.http.post(
      this.GITHUB_URL,
      {'query': '{viewer {name avatarUrl login}}'},
      {
        headers: new HttpHeaders().set('Authorization', 'Bearer ' + token),
        responseType: 'json'
      }
    ).toPromise().then(response => {
      return response['data']['viewer'];
    });
  }
}
