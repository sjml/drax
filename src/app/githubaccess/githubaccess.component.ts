import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

import { Queries } from './graphqlQueries';

class GitHubUser {
  public fullName: string;
  public login: string;
  public avatarUrl: string;
}

class GitHubNode {
  public name: string;
  public fullPath: string;
}

class GitHubRepo extends GitHubNode {
  public defaultBranch: string;
  public isPrivate: boolean;
  public description: string;
}

class GitHubItem extends GitHubNode {
  public isDirectory: boolean;
}

@Component({
  selector: 'app-githubaccess',
  templateUrl: './githubaccess.component.html',
  styleUrls: ['./githubaccess.component.scss']
})
export class GitHubAccessComponent implements OnInit {

  GITHUB_URL = 'https://api.github.com/graphql';

  bearerToken: String = null;
  user: GitHubUser = null;
  currentRepo: GitHubRepo = null;

  currentNavList: GitHubNode[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.bearerToken = localStorage.getItem('gitHubBearerToken');
    if (this.bearerToken !== null) {
      this.loadUser();
      this.getRepositoryList().then(list => this.currentNavList = list);
    }

    const fakeRepo1 = new GitHubRepo();
    fakeRepo1.defaultBranch = 'master';
    fakeRepo1.name = 'repo1';
    fakeRepo1.description = 'An excellent repository.';
    fakeRepo1.isPrivate = false;

    const fakeRepo2 = new GitHubRepo();
    fakeRepo2.defaultBranch = 'v2';
    fakeRepo2.name = 'repo2';
    fakeRepo2.description = 'A shitty, secret repository.';
    fakeRepo2.isPrivate = true;

    this.currentNavList = [fakeRepo1, fakeRepo2];
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
      // TODO: make this URL a configurable parameter
      'http://localhost:4201/auth/',
      'GitHub Authorization',
      'scrollbars=yes,width=' + popUpWidth + ',height=' + popUpHeight + ',top=' + top + ',left=' + left
    );
  }

  loadUser() {
    this.getUserData(this.bearerToken).then(user => {
      this.user = new GitHubUser();
      this.user.fullName = user['name'];
      this.user.login = user['login'];
      this.user.avatarUrl = user['avatarUrl'];
    });
  }

  private graphQlQuery(query: object): Observable<object> {
    // TODO: give back nothing if we're not logged in
    return this.http.post(
      this.GITHUB_URL, query,
      {
        headers: new HttpHeaders().set('Authorization', 'Bearer ' + this.bearerToken),
        responseType: 'json'
      }
    );
  }

  getUserData(token: String): Promise<Object> {
    return this.graphQlQuery(Queries.userInfo).toPromise().then(response => {
      return response['data']['viewer'];
    });
  }

  getRepositoryList(): Promise<GitHubRepo[]> {
    return this.graphQlQuery(Queries.repoInfo).toPromise().then(response => {
      const repoList = [];
      for (const repoNode of response['data']['viewer']['repositories']['edges']) {
        const repo = repoNode.node;
        // TODO: with this and with user, is there some shorthand to just shunt it in?
        const newRepo = new GitHubRepo();
        newRepo.name = repo.name;
        newRepo.isPrivate = repo.isPrivate;
        newRepo.description = repo.description;
        newRepo.defaultBranch = repo.defaultBranchRef.name;
        newRepo.fullPath = repo.name + ':' + repo.defaultBranchRef.name;
        repoList.push(newRepo);
      }
      return repoList;
    });
  }
}
