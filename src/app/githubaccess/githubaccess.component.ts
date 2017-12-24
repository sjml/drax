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

class GitHubContinuation extends GitHubNode {
  public continuation: string = null;
}

class GitHubRepoList {
  public repos: GitHubRepo[] = [];
  public continuation: string = null;
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
      this.loadRepoList();
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
        this.loadRepoList();
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

  loadRepoList(fromCursor: string = null) {
    if (fromCursor === null) {
      this.currentNavList = [];
    }
    this.getRepositoryList(fromCursor).then(list => {
      this.currentNavList = this.currentNavList.concat(list.repos);
      if (list.continuation !== null) {
        const cont = new GitHubContinuation();
        cont.continuation = list.continuation;
        cont.name = '[CONTINUATION]';
        this.currentNavList.push(cont);
      }
    });
  }

  onScroll(event: Event) {
    if (this.currentNavList.length <= 0) {
      return;
    }

    const lastItem = this.currentNavList[this.currentNavList.length - 1];
    if (lastItem instanceof GitHubContinuation) {
      const offset = event.srcElement.scrollTop + event.srcElement.clientHeight;
      const max = event.srcElement.scrollHeight;

      if (max - offset < 20) {
        // TODO: set up a lock so this can't get double-called
        this.currentNavList.pop();
        this.loadRepoList((lastItem as GitHubContinuation).continuation);
      }
    }
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
    return this.graphQlQuery(Queries.getUserInfo()).toPromise().then(response => {
      return response['data']['viewer'];
    });
  }

  getRepositoryList(cursor: string = null): Promise<GitHubRepoList> {
    return this.graphQlQuery(Queries.getRepoInfo(cursor)).toPromise().then(response => {
      const repoListQuery = new GitHubRepoList();
      const repList = response['data']['viewer']['repositories'];
      if (repList['pageInfo']['hasNextPage']) {
        repoListQuery.continuation = repList['pageInfo']['endCursor'];
      }

      for (const repoNode of repList['edges']) {
        const repo = repoNode.node;
        // TODO: with this and with user, is there some shorthand to just shunt it in?
        const newRepo = new GitHubRepo();
        newRepo.name = repo.name;
        newRepo.isPrivate = repo.isPrivate;
        newRepo.description = repo.description;
        newRepo.defaultBranch = repo.defaultBranchRef.name;
        newRepo.fullPath = repo.name + ':' + repo.defaultBranchRef.name;
        repoListQuery.repos.push(newRepo);
      }

      return repoListQuery;
    });
  }
}
