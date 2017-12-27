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
  public nodeType = 'NODE';
  public name: string;
  public fullPath: string;
}

export class GitHubRepo extends GitHubNode {
  public nodeType = 'REPO';
  public defaultBranch: string;
  public isPrivate: boolean;
  public description: string;
  public owner: string;
}

export class GitHubItem extends GitHubNode {
  public nodeType = 'ITEM';
  public isDirectory: boolean;
  public isBinary: boolean;
  public repo: GitHubRepo;
}

class GitHubContinuation extends GitHubNode {
  public nodeType = 'CONT';
  public continuation: string = null;
}

class GitHubPrevious extends GitHubNode {
  public nodeType = 'PREV';
  public name = '..';
}

export class GitHubFile {
  public isDirty = false;
  public readonly pristine: string = null;
  public contents: string = null;
  public item: GitHubItem = null;

  constructor(originalContents: string) {
    this.pristine = originalContents;
    this.contents = originalContents;
  }
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

  bearerToken: string = null;
  user: GitHubUser = null;
  currentRepo: GitHubRepo = null;
  currentDirPath: string[] = [];
  currentFilePath: string = null;

  workingFile: GitHubFile = null;

  currentNavList: GitHubNode[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.bearerToken = localStorage.getItem('gitHubBearerToken');
    if (this.bearerToken !== null) {
      this.loadUser().then(user => {
        const repoCheck = localStorage.getItem('currentRepo');
        if (repoCheck !== null) {
          this.currentRepo = JSON.parse(repoCheck) as GitHubRepo;
          this.loadFileList(this.currentRepo);
        } else {
          this.loadRepoList();
        }
      });
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
    }, false);

    const popupRef = window.open(
      'http://localhost:4201/auth/',
      'GitHub Authorization',
      'scrollbars=yes,width=' + popUpWidth + ',height=' + popUpHeight + ',top=' + top + ',left=' + left
    );
  }

  loadUser(): Promise<GitHubUser> {
    return this.getUserData(this.bearerToken).then(user => {
      this.user = new GitHubUser();
      this.user.fullName = user['name'];
      this.user.login = user['login'];
      this.user.avatarUrl = user['avatarUrl'];

      return this.user;
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

  loadFileList(repo: GitHubRepo, path: string[] = null) {
    let pathString: string = null;
    if (path !== null) {
      pathString = path.join('/');
    }

    this.currentNavList = [];
    this.currentNavList.push(new GitHubPrevious());
    this.graphQlQuery(Queries.getFileList(repo, pathString)).toPromise().then(response => {
      for (const entry of response['data']['repository']['object']['entries']) {
        const ghItem = new GitHubItem();
        ghItem.repo = repo;
        ghItem.name = entry['name'];
        if (entry['type'] === 'tree') {
          ghItem.isDirectory = true;
        }
        else if (entry['type'] === 'blob') {
          ghItem.isDirectory = false;
          ghItem.isBinary = entry['object']['isBinary'];
        }
        if (pathString !== null) {
          ghItem.fullPath = pathString + '/';
        }
        else {
          ghItem.fullPath = '';
        }
        ghItem.fullPath += entry['name'];

        this.currentNavList.push(ghItem);
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
        this.currentNavList.pop();
        this.loadRepoList((lastItem as GitHubContinuation).continuation);
      }
    }
  }

  private graphQlQuery(query: object): Observable<object> {
    return this.http.post(
      this.GITHUB_URL, query,
      {
        headers: new HttpHeaders().set('Authorization', 'Bearer ' + this.bearerToken),
        responseType: 'json'
      }
    );
  }

  handleClick(node: GitHubNode) {
    if (node instanceof GitHubRepo) {
      this.currentRepo = node as GitHubRepo;
      localStorage.setItem('currentRepo', JSON.stringify(this.currentRepo));
      this.loadFileList(this.currentRepo);
    }
    else if (node instanceof GitHubPrevious) {
      if (this.currentDirPath.length > 0) {
        this.currentDirPath.pop();
        this.loadFileList(this.currentRepo, this.currentDirPath);
      }
      else {
        localStorage.removeItem('currentRepo');
        this.loadRepoList();
      }
    }
    else if (node instanceof GitHubItem) {
      const item = node as GitHubItem;
      if (item.isDirectory) {
        this.currentDirPath.push(item.name);
        this.loadFileList(this.currentRepo, this.currentDirPath);
      }
      else {
        this.getFileContents(item).then(text => {
          this.workingFile = new GitHubFile(text);
          this.workingFile.item = item;
        });
      }
    }
  }

  getUserData(token: string): Promise<Object> {
    return this.graphQlQuery(Queries.getUserInfo()).toPromise().then(response => {
      return response['data']['viewer'];
    });
  }

  getFileContents(item: GitHubItem): Promise<string> {
    return this.graphQlQuery(Queries.getFileContents(item)).toPromise().then(response => {
      return response['data']['repository']['object']['text'];
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
        const newRepo = new GitHubRepo();
        newRepo.name = repo.name;
        newRepo.isPrivate = repo.isPrivate;
        newRepo.description = repo.description;
        newRepo.owner = repo.owner.login;
        newRepo.defaultBranch = repo.defaultBranchRef ? repo.defaultBranchRef.name : null;
        newRepo.fullPath = newRepo.owner + '/' + newRepo.name;
        if (newRepo.defaultBranch !== null) {
          newRepo.fullPath += ':' + newRepo.defaultBranch;
        }
        repoListQuery.repos.push(newRepo);
      }

      return repoListQuery;
    });
  }
}
