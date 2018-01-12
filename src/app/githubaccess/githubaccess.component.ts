import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';
import { ConfigService } from '../config.service';
import { Queries } from './graphqlQueries';
import { ModalService } from '../drax-modal/modal.service';
import { ModalField } from '../drax-modal/drax-modal.component';
import { isDate } from 'util';

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
  public config: object = {
    ignoreHiddenFiles: true,
    contentRoot: '',
    showOnlyMarkdown: false
  };

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
      return `/${this.repo.owner}/${this.repo.name}:${this.branch}/${this.dirPath}`;
    }
    else {
      return `/${this.repo.owner}/${this.repo.name}:${this.branch}/${this.fullPath()}`;
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

  isOpen = false;

  bearerToken: string = null;
  user: GitHubUser = null;
  repo: GitHubRepo = null;
  item: GitHubItem = null;

  workingFile: GitHubFile = null;
  displayPage: string = null;

  upwardsLink: string = null;
  upwardsLinkLabel: string = null;
  currentNavList: GitHubNavNode[] = [];

  private repositoryListCursor: string = null;

  constructor(
    private config: ConfigService,
    private modalService: ModalService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit() {
    this.bearerToken = localStorage.getItem('gitHubBearerToken');
    if (this.bearerToken !== null) {
      this.loggedIn();
    }
    this.route.params.subscribe(_ => {
      this.loadFromLocation();
    });
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  loggedIn() {
    this.loadUser();
    this.loadFromLocation();
  }

  logout() {
    localStorage.removeItem('gitHubBearerToken');
    this.bearerToken = null;
    this.user = null;
    this.workingFile = null;
    this.repo = null;
    this.currentNavList = [];
    this.router.navigateByUrl('/');
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
      this.config.getConfig('authUrl'),
      'GitHub Authorization',
      'scrollbars=yes,width=' + popUpWidth + ',height=' + popUpHeight + ',top=' + top + ',left=' + left
    );
  }

  // TODO: have this take params from the subscription
  loadFromLocation() {
    const newPage = this.route.snapshot.paramMap.get('pageName');
    if (newPage !== null) {
      this.displayPage = newPage;
      this.workingFile = null;
    }

    this.repo = new GitHubRepo();
    this.repo.owner = this.route.snapshot.paramMap.get('owner');
    this.repo.name = this.route.snapshot.paramMap.get('name');

    if (!this.bearerToken || this.repo.owner === null || this.repo.name === null) {
      this.router.navigateByUrl('/');
      if (this.bearerToken) {
        this.loadRepositoryList().then(cont => {
          this.repositoryListCursor = cont;
        });
      }
      return;
    }

    this.item = new GitHubItem();
    this.item.branch = this.route.snapshot.paramMap.get('branch');
    this.item.dirPath = this.route.snapshot.paramMap.get('dirPath');
    this.item.fileName = this.route.snapshot.paramMap.get('itemName') || '';
    this.item.repo = this.repo;

    this.checkRepoAndFile();
  }

  private checkRoot(dirPath: string, contentRoot: string): boolean {
    if (contentRoot.length === 0) {
      return true;
    }
    if (dirPath === null) {
      return false;
    }
    if (dirPath.startsWith(contentRoot)) {
      return true;
    }
    return false;
  }

  async checkRepoAndFile() {
    let repoGood = null;
    let pathGood = false;

    await this.loadRepo(this.repo).then(resp => repoGood = resp);
    if (this.item.branch === null) {
      this.item.branch = this.repo.defaultBranch;
    }

    // are we a file or directory? need to get info.
    await this.getPathInfo(this.item).then(response => {
      if (response === null) {
        repoGood = false;
      }
      else if (response['object'] === null) {
        pathGood = false;
      }
      else if (!this.checkRoot(this.item.fullPath(), this.repo.config['contentRoot'])) {
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
      this.router.navigateByUrl('/');
      return;
    }
    if (!pathGood) {
      let redirect = this.repo.getRouterPath();
      if (this.repo.config['contentRoot'].length > 0) {
        redirect += `/${this.repo.config['contentRoot']}`;
      }
      this.router.navigateByUrl(redirect);
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

      // check for remote configuration
      const item = new GitHubItem();
      item.repo = repo;
      item.branch = repo.defaultBranch;
      item.dirPath = '.drax';
      item.fileName = 'config.json';
      return this.getFileContents(item).then(fileResponse => {
        if (fileResponse !== null) {
          const remoteConfig = JSON.parse(fileResponse.contents);
          repo.config = Object.assign(repo.config, remoteConfig);
        }
        return true;
      });
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
    return this.graphQlQuery(Queries.getRepoInfo(cursor), 'repoList').toPromise().then(response => {
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
      if (item.fullPath() === item.repo.config['contentRoot']) {
        this.upwardsLink = '/';
        this.upwardsLinkLabel = 'Repository List';
      }
      else {
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
    }
    else {
      this.upwardsLink = '/';
      this.upwardsLinkLabel = 'Repository List';
    }

    this.graphQlQuery(Queries.getFileList(item), 'fileList').toPromise().then(response => {
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

        if (!item.repo.config['ignoreHiddenFiles'] || !ghItem.fileName.startsWith('.')) {
          this.currentNavList[index++] = ghItem;
        }
      }
      this.currentNavList.length = index;
    });
  }

  createNewRepoButtonResponse() {
    const fields: ModalField[] = [
      {name: 'repoName', value: '', required: true, placeholder: 'Repository Name'},
      {name: 'repoDesc', value: '', required: false, placeholder: 'Description of Repository', showAsTextArea: true}
    ];
    this.modalService.display({
                                title: 'Create Repository',
                                description: 'Create a new collection of files on GitHub.',
                                fields: fields
                              },
      (pressedOK, values) => {
        if (pressedOK) {
          this.createRepo(values['repoName'], values['repoDesc'])
            .then(response => {
              if (!response['success']) {
                // TODO: grace
              }
              else {
                const repo = new GitHubRepo();
                repo.owner = this.user.login;
                repo.name = response['name'];
                this.loadRepo(repo).then((success) => {
                  if (!success) {
                    // TODO: grace
                  }
                  else {
                    this.router.navigateByUrl(repo.getRouterPath());
                  }
                });
              }
            });
        }
      }
    );
  }

  createNewFileButtonResponse(isDirectory: boolean = false) {
    let pathType = 'File';
    if (isDirectory) { pathType = 'Folder'; }
    const fields: ModalField[] = [
      {
        name: 'pathName',
        value: '',
        required: true,
        placeholder: `The name of the new ${pathType.toLowerCase()}.`
      },
      {
        name: 'commitMessage',
        value: '',
        required: true,
        showAsTextArea: true,
        placeholder: `A brief note about why you're creating this ${pathType.toLowerCase()}.`
      }
    ];
    this.modalService.display({
                                title: `Create New ${pathType}`,
                                description: `Create a new ${pathType.toLowerCase()} in the current folder.`,
                                fields: fields
                              },
      (pressedOK, values) => {
        if (pressedOK) {
          const i = new GitHubItem();
          i.repo = this.repo;
          i.isDirectory = false;
          i.isBinary = false;
          i.branch = this.item.branch;
          if (this.item.isDirectory) {
            i.dirPath = this.item.fullPath();
          }
          else {
            i.dirPath = this.item.dirPath;
          }
          if (isDirectory) { // creating new directory
            i.dirPath += `${values['pathName']}`;
            i.fileName = '.gitkeep';
          }
          else {
            i.fileName = values['pathName'];
          }
          const f = new GitHubFile('');
          f.item = i;

          this.pushFile(f, values['commitMessage'], true)
                .then((response) => {
                  if (!response['success']) {
                    // TODO: grace
                    console.error(response['error']);
                  }
                  else {
                    const path = f.item.getRouterPath(isDirectory);
                    this.router.navigateByUrl(path);
                  }
                });
        }
      }
    );
  }

  /******** Remote Data Access *******/

  private graphQlQuery(query: object, queryLog: string): Observable<object> {
    if (!environment.production) {
      console.log(`Query: ${queryLog}`);
      // console.log(query);
    }
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
    return this.graphQlQuery(Queries.getUserInfo(), 'userData').toPromise().then(response => {
      return response['data']['viewer'];
    });
  }

  getSingleRepo(repo: GitHubRepo): Promise<object> {
    return this.graphQlQuery(Queries.getSingleRepoInfo(repo), 'singleRepo').toPromise().then(response => {
      return response['data']['repository'];
    });
  }

  getPathInfo(item: GitHubItem): Promise<object> {
    return this.graphQlQuery(Queries.getPathInfo(item), 'pathInfo').toPromise().then(response => {
      return response['data']['repository'];
    });
  }

  getFileContents(item: GitHubItem): Promise<GitHubFile> {
    const q = Queries.getFileContents(item);
    return this.graphQlQuery(Queries.getFileContents(item), 'fileContents').toPromise().then(response => {
      const obj = response['data']['repository']['object'];
      if (obj === null) {
        return null;
      }
      const file = new GitHubFile(obj['text']);
      file.item = this.item;
      file.item.lastGet = obj['oid'];
      return file;
    });
  }

  // this annoyingly has to be done with the old API. :'(
  pushFile(file: GitHubFile, message: string, newFile: boolean = false): Promise<object> {
    return this.getPathInfo(file.item).then<object>(info => {
      if (!newFile) {
        // TODO: grace
        if (!info || !info['object'] || !info['object']['oid']) {
          return {success: false, message: 'Non-existent object.'};
        }
        if (info['object']['oid'] !== file.item.lastGet) {
          return {success: false, message: 'ID mismatch!'};
        }
      }
      else {
        if (!info || info['object'] !== null) {
          return {success: false, message: 'File already exists.'};
        }
      }

      const args = {
        message: message,
        content: btoa(file.contents),
        branch: file.item.branch
      };

      if (!newFile) {
        args['sha'] = file.item.lastGet;
      }

      return this.http.put(
        'https://api.github.com/repos/' +
        `${file.item.repo.owner}/${file.item.repo.name}/contents/${file.item.fullPath()}`,
        args,
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

  createRepo(name: string, description: string): Promise<object> {
    return this.http.post(
      'https://api.github.com/user/repos',
      {
        name: name,
        description: description,
        auto_init: true
      },
      {
        headers: new HttpHeaders().set('Authorization', 'Bearer ' + this.bearerToken),
        responseType: 'json'
      }

    ).toPromise().then(response => {
      console.log(response);
      return {success: true, name: response['name']};
    })
    .catch(error => {
      // TODO: grace
      console.error(error);
      return {success: false};
    });
  }

}
