import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { Queries } from './graphqlQueries';

class GitHubUser {
  public fullName: string;
  public login: string;
  public avatarUrl: string;
}

abstract class GitHubNavNode {
  public nodeType = 'NODE';
}

export class GitHubRepo extends GitHubNavNode {
  public nodeType = 'REPO';
  public owner: string;
  public name: string;

  public isPrivate: boolean;
  public description: string;
  public defaultBranch: string;

  public getRouterPath() {
    if (this.defaultBranch !== null) {
      return `/${this.owner}/${this.name}:${this.defaultBranch}`;
    }
    else {
      return `/${this.owner}/${this.name}`;
    }
  }
}

export class GitHubItem extends GitHubNavNode {
  public nodeType = 'ITEM';
  public repo: GitHubRepo;
  public branch: string;
  public dirPath: string;
  public fileName: string;

  public isDirectory: boolean;
  public isBinary: boolean;
  public lastGet: string;

  public fullPath(): string {
    if (this.dirPath === null || this.dirPath.length === 0) {
      return this.fileName;
    }
    return `${this.dirPath}/${this.fileName}`;
  }

  public getRouterPath(dirOnly: boolean = false): string {
    if (dirOnly) {
      return `/${this.repo.owner}/${this.repo.name}:${this.repo.defaultBranch}/${this.dirPath}`;
    }
    else {
      return `/${this.repo.owner}/${this.repo.name}:${this.repo.defaultBranch}/${this.fullPath()}`;
    }
  }
}

export class GitHubFile {
  public isDirty = false;
  public pristine: string = null;
  public contents: string = null;
  public item: GitHubItem = null;

  constructor(originalContents: string) {
    this.pristine = originalContents;
    this.contents = originalContents;
  }
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
  repo: GitHubRepo = null;
  item: GitHubItem = null;

  workingFile: GitHubFile = null;

  upwardsLink: string = null;
  upwardsLinkLabel: string = null;
  currentNavList: GitHubNavNode[] = [];

  private repositoryListCursor: string = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private location: Location
  ) { }

  ngOnInit() {
    this.bearerToken = localStorage.getItem('gitHubBearerToken');
    if (this.bearerToken !== null) {
      this.loggedIn();
    }

  }

  loggedIn() {
    this.loadUser();
    this.route.params.subscribe(_ => {
      this.loadFromLocation();
    });
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
        this.bearerToken = event.data.code;
        localStorage.setItem('gitHubBearerToken', event.data.code);
        this.loggedIn();
      }
    }, false);

    const popupRef = window.open(
      'http://localhost:4201/auth/',
      'GitHub Authorization',
      'scrollbars=yes,width=' + popUpWidth + ',height=' + popUpHeight + ',top=' + top + ',left=' + left
    );
  }

  // TODO: have this take params from the subscription
  loadFromLocation() {
    this.repo = new GitHubRepo();
    this.repo.owner = this.route.snapshot.paramMap.get('owner');
    this.repo.name = this.route.snapshot.paramMap.get('name');

    if (this.repo.owner === null || this.repo.name === null) {
      this.loadRepositoryList().then(cont => {
        this.repositoryListCursor = cont;
      });
      return;
    }

    this.item = new GitHubItem();
    this.item.branch = this.route.snapshot.paramMap.get('branch');
    this.item.dirPath = this.route.snapshot.paramMap.get('dirPath');
    this.item.fileName = this.route.snapshot.paramMap.get('itemName') || '';
    this.item.repo = this.repo;

    this.checkRepoAndFile();
  }

  async checkRepoAndFile() {
    let repoGood = null;
    let pathGood = false;

    if (this.item.branch === null) {
      await this.loadRepo(this.repo).then(resp => repoGood = resp);
      this.item.branch = this.repo.defaultBranch;
    }
    else {
      this.loadRepo(this.repo).then(resp => repoGood = resp);
    }

    // are we a file or directory? need to get info.
    await this.getPathInfo(this.item).then(response => {
      if (response === null) {
        repoGood = false;
      }
      else if (response['object'] === null) {
        pathGood = false;
      }
      else {
        pathGood = true;
        this.item.isDirectory = response['object']['__typename'] === 'Tree';
        this.item.lastGet = response['object']['oid'];
      }
    });

    // (if it's null, the check hasn't completed yet)
    if (repoGood === false) {
      // TODO: redirect to repo list -- this.router.navigate(['/component-one']);
      return;
    }
    if (!pathGood) {
      // TODO: redirect to repo
      this.item = null;
      return;
    }

    if (this.item.isDirectory) {
      this.loadDirectoryListing(this.item);
    }
    else {
      const parent = new GitHubItem();
      parent.repo = this.item.repo;
      parent.branch = this.item.branch;
      parent.isDirectory = true;

      const pathSegs = this.item.dirPath.split('/');
      parent.fileName = pathSegs.pop();
      parent.dirPath = pathSegs.join('/');

      this.loadDirectoryListing(parent);
      this.getFileContents(this.item).then(respFile => {
        this.workingFile = respFile;
      });
    }
  }

  loadUser(): Promise<GitHubUser> {
    return this.getUserData().then(user => {
      this.user = new GitHubUser();
      this.user.fullName = user['name'];
      this.user.login = user['login'];
      this.user.avatarUrl = user['avatarUrl'];

      return this.user;
    }).catch(err => {
      console.error('Could not load GitHub User.');
      console.error(err);
      return null;
    });
  }

  loadRepo(repo: GitHubRepo): Promise<boolean> {
    if (repo === null) {
      return Promise.resolve(false);
    }
    return this.getSingleRepo(repo).then(response => {
      if (response === null) {
        return false;
      }
      repo.defaultBranch = response['defaultBranchRef']['name'];
      repo.isPrivate = response['isPrivate'];
      repo.description = response['description'];
      return true;
    });
  }

  onScroll(event: Event) {
    if (this.currentNavList.length <= 0) {
      return;
    }

    if (this.repositoryListCursor !== null) {
      const offset = event.srcElement.scrollTop + event.srcElement.clientHeight;
      const max = event.srcElement.scrollHeight;

      if (max - offset < 20) {
        this.loadRepositoryList(this.repositoryListCursor).then(cont => {
          this.repositoryListCursor = cont;
        });
      }
    }
  }

  loadRepositoryList(cursor: string = null): Promise<string> {
    this.repo = null;
    this.item = null;
    this.upwardsLinkLabel = null;
    this.upwardsLink = null;

    let index = 0;
    if (cursor !== null) {
      index = this.currentNavList.length;
    }
    return this.graphQlQuery(Queries.getRepoInfo(cursor)).toPromise().then(response => {
      const repList = response['data']['viewer']['repositories'];
      let continuation: string = null;
      if (repList['pageInfo']['hasNextPage']) {
        continuation = repList['pageInfo']['endCursor'];
      }

      for (const repoNode of repList['edges']) {
        const repo = repoNode.node;
        const newRepo = new GitHubRepo();
        newRepo.name = repo.name;
        newRepo.isPrivate = repo.isPrivate;
        newRepo.description = repo.description;
        newRepo.owner = repo.owner.login;
        // TODO: play around with a repo that has no default branch (no pushes)
        newRepo.defaultBranch = repo.defaultBranchRef ? repo.defaultBranchRef.name : '';

        this.currentNavList[index++] = newRepo;
      }
      this.currentNavList.length = index;

      return continuation;
    });
  }

  loadDirectoryListing(item: GitHubItem) {
    if (!item.isDirectory) {
      console.error('Cannot load listing of non-directory.');
      return;
    }

    this.repositoryListCursor = null;

    // TODO: UGH this is convoluted spaghetti
    if (item.dirPath !== null) {
      const pathSegs = item.dirPath.split('/');
      this.upwardsLinkLabel = pathSegs.pop();
      if (this.upwardsLinkLabel.length === 0) {
        if (item.fileName.length === 0) {
          this.upwardsLinkLabel = 'Repository List';
        }
        else {
          this.upwardsLinkLabel = `${item.repo.owner}/${item.repo.name}:${item.branch}`;
        }
      }
      if (this.upwardsLinkLabel === 'Repository List') {
        this.upwardsLink = '/';
      }
      else {
        this.upwardsLink = item.getRouterPath(true);
      }
    }
    else {
      this.upwardsLink = '/';
      this.upwardsLinkLabel = 'Repository List';
    }

    this.graphQlQuery(Queries.getFileList(item)).toPromise().then(response => {
      let index = 0;
      for (const entry of response['data']['repository']['object']['entries']) {
        const ghItem = new GitHubItem();
        ghItem.repo = item.repo;
        ghItem.branch = item.branch;
        ghItem.fileName = entry['name'];
        if (entry['type'] === 'tree') {
          ghItem.isDirectory = true;
        }
        else if (entry['type'] === 'blob') {
          ghItem.isDirectory = false;
          ghItem.isBinary = entry['object']['isBinary'];
        }
        ghItem.dirPath = item.fullPath();

        this.currentNavList[index++] = ghItem;
      }
      this.currentNavList.length = index;
    });
  }

  /******** Remote Data Access *******/

  private graphQlQuery(query: object): Observable<object> {
    if (this.bearerToken === null) {
      console.error('No bearer token.');
      return null;
    }
    return this.http.post(
      this.GITHUB_URL, query,
      {
        headers: new HttpHeaders().set('Authorization', 'Bearer ' + this.bearerToken),
        responseType: 'json'
      }
    );
  }

  getUserData(): Promise<object> {
    return this.graphQlQuery(Queries.getUserInfo()).toPromise().then(response => {
      return response['data']['viewer'];
    });
  }

  getSingleRepo(repo: GitHubRepo): Promise<object> {
    return this.graphQlQuery(Queries.getSingleRepoInfo(repo)).toPromise().then(response => {
      return response['data']['repository'];
    });
  }

  getPathInfo(item: GitHubItem): Promise<object> {
    return this.graphQlQuery(Queries.getPathInfo(item)).toPromise().then(response => {
      return response['data']['repository'];
    });
  }

  getFileContents(item: GitHubItem): Promise<GitHubFile> {
    return this.graphQlQuery(Queries.getFileContents(item)).toPromise().then(response => {
      const obj = response['data']['repository']['object'];
      const file = new GitHubFile(obj['text']);
      file.item = this.item;
      file.item.lastGet = obj['oid'];
      return file;
    });
  }

  // this annoyingly has to be done with the old API. :'(
  pushFile(file: GitHubFile, message: string): Promise<object> {
    return this.getPathInfo(file.item).then<object>(info => {
      // TODO: grace
      if (!info || !info['object'] || !info['object']['oid']) {
        return {success: false, message: 'Non-existent object.'};
      }
      if (info['object']['oid'] !== file.item.lastGet) {
        return {success: false, message: 'ID mismatch!'};
      }

      return this.http.put(
        'https://api.github.com/repos/' +
        `${file.item.repo.owner}/${file.item.repo.name}/contents/${file.item.fullPath()}`,
        {
          message: message,
          content: btoa(file.contents),
          sha: file.item.lastGet,
          branch: file.item.branch
        },
        {
          headers: new HttpHeaders().set('Authorization', 'Bearer ' + this.bearerToken),
          responseType: 'json'
        }
      ).toPromise()
        .then(response => {
          file.item.lastGet = response['content']['sha'];
          file.isDirty = false;
          file.pristine = file.contents;
          return {success: true};
        })
        .catch(error => {
          // TODO: grace
          return {success: false, message: 'PUT failed!', error: error};
        })
      ;
    });
  }

}
