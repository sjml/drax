import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlSegment } from '@angular/router';

import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';
import { Queries } from './graphqlQueries';
import { GitHubFile,
         GitHubItem,
         GitHubRepo,
         GitHubUser
       } from './githubclasses';
import { ConfigService } from '../config.service';

@Injectable()
export class GitHubService {
  GITHUB_URL = 'https://api.github.com/graphql';

  user: GitHubUser = null;
  bearerToken: string = null;

  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  getCurrentUser(): Promise<GitHubUser> {
    if (this.user) {
      return Promise.resolve(this.user);
    }
    if (this.bearerToken === null) {
      this.bearerToken = localStorage.getItem('gitHubBearerToken');
      if (this.bearerToken === null) {
        return Promise.resolve(null);
      }
    }
    return this.getUserData()
                  .then(user => {
                    const newUser = new GitHubUser();
                    newUser.fullName = user['name'];
                    newUser.login = user['login'];
                    newUser.avatarUrl = user['avatarUrl'];

                    this.user = newUser;
                    return this.user;
                  })
                  .catch(err => {
                    console.error('Could not load GitHub user.');
                    console.error(err);
                    return null;
                  });
  }

  logout() {
    localStorage.removeItem('gitHubBearerToken');
    this.bearerToken = null;
    this.user = null;
  }

  attemptAuthorization(callback: (user: GitHubUser) => void = null) {
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

    window.addEventListener('message', event => {
      if (event.data.status === 'OK') {
        this.bearerToken = event.data.code;
        localStorage.setItem('gitHubBearerToken', event.data.code);
        this.getCurrentUser().then((user) => {
          if (callback !== null) {
            callback(user);
          }
        });
      }
      else {
        if (callback !== null) {
          callback(null);
        }
      }
    }, false);

    const popupRef = window.open(
      this.config.getConfig('authUrl'),
      'GitHub Authorization',
      'scrollbars=yes,width=' + popUpWidth + ',height=' + popUpHeight + ',top=' + top + ',left=' + left
    );
  }

  loadRepoData(repo: GitHubRepo): Promise<boolean> {
    if (repo === null) {
      return Promise.resolve(false);
    }

    // don't do a total refetch if we've gotten data in last 5 minutes
    const now = Date.now();
    if (repo.lastFetchTime !== null && repo.lastFetchTime - now < 60 * 5 * 1000) {
      return Promise.resolve(true);
    }

    return this.getSingleRepo(repo).then(response => {
      if (response === null) {
        repo.lastFetchTime = null;
        return false;
      }
      repo.defaultBranch = response['defaultBranchRef']['name'];
      repo.isPrivate = response['isPrivate'];
      repo.description = response['description'];
      repo.lastFetchTime = now;

      // check for remote configuration
      const confObject = response['object'];
      if (confObject !== null) {
        const remoteConfig = JSON.parse(confObject.text);
        repo.config = Object.assign(repo.config, remoteConfig);
        repo.config['hasConfig'] = true;
      }
      return true;
    });
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

  loadItemData(item: GitHubItem): Promise<boolean> {
    if (item === null) {
      return Promise.resolve(false);
    }

    return this.loadRepoData(item.repo).then(repoResponse => {
      if (repoResponse === false) {
        item.lastGet = null;
        return false;
      }
      if (item.branch === null) {
        item.branch = item.repo.defaultBranch;
      }
      return this.getPathInfo(item).then(itemResponse => {
        if (itemResponse === null) {
          item.lastGet = null;
          return false;
        }
        if (itemResponse['object'] === null) {
          item.lastGet = null;
          return false;
        }
        if (!this.checkRoot(item.getFullPath(), item.repo.config['contentRoot'])) {
          item.lastGet = null;
          return false;
        }

        item.isDirectory = itemResponse['object']['__typename'] === 'Tree';
        if (!item.isDirectory) {
          item.isBinary = itemResponse['object']['isBinary'];
        }
        item.lastGet = itemResponse['object']['oid'];
        return true;
      });
    });
  }

  getDataFromUrl(urlSegs: UrlSegment[]): {repo: GitHubRepo, item: GitHubItem } {
    if (urlSegs.length < 2) {
      return { repo: null, item: null }; // TODO: grace
    }

    const repo = new GitHubRepo();
    repo.owner = urlSegs[0].path;
    const splits = urlSegs[1].path.split(':');
    repo.name = splits[0];

    const singleRepoData = this.config.getConfig('singleRepo');
    if (singleRepoData !== null) {
      if (
             repo.owner !== singleRepoData['owner']
          || repo.name  !== singleRepoData['name']
         ) {
        return { repo: null, item: null };
      }
    }

    let item: GitHubItem = null;
    if (urlSegs.length > 2) {
      item = new GitHubItem();
      item.repo = repo;
      if (splits.length > 1) {
        item.branch = splits[1];
      }
      item.fileName = urlSegs.pop().path;
      item.dirPath = urlSegs.slice(2).join('/');
    }
    return {repo: repo, item: item};
  }

  /***** Data Access *****/
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

  getRepoList(cursor: string = null): Promise<{continuation: string, repos: GitHubRepo[]}> {
    return this.graphQlQuery(Queries.getRepoInfo(cursor), 'repoList').toPromise().then(response => {
      const repList = response['data']['viewer']['repositories'];
      let continuation: string = null;
      if (repList['pageInfo']['hasNextPage']) {
        continuation = repList['pageInfo']['endCursor'];
      }

      const repos: GitHubRepo[] = [];
      for (const repoNode of repList['edges']) {
        const repo = repoNode.node;
        const newRepo = new GitHubRepo();
        newRepo.name = repo.name;
        newRepo.isPrivate = repo.isPrivate;
        newRepo.description = repo.description;
        newRepo.owner = repo.owner.login;
        // TODO: play around with a repo that has no default branch (no pushes)
        newRepo.defaultBranch = repo.defaultBranchRef ? repo.defaultBranchRef.name : '';
        newRepo.lastFetchTime = Date.now();
        repos.push(newRepo);
      }

      return {continuation: continuation, repos: repos};
    });
  }

  getPathInfo(item: GitHubItem): Promise<object> {
    return this.graphQlQuery(Queries.getPathInfo(item), 'pathInfo').toPromise().then(response => {
      return response['data']['repository'];
    });
  }

  getFileList(dir: GitHubItem): Promise<GitHubItem[]> {
    if (!dir.isDirectory) {
      console.error('Cannot load listing of non-directory.');
      return null;
    }

    return this.graphQlQuery(Queries.getFileList(dir), 'fileList').toPromise().then(response => {
      const items: GitHubItem[] = [];
      for (const entry of response['data']['repository']['object']['entries']) {
        const ghItem = new GitHubItem();
        ghItem.repo = dir.repo;
        ghItem.branch = dir.branch;
        ghItem.fileName = entry['name'];
        if (entry['type'] === 'tree') {
          ghItem.isDirectory = true;
        }
        else if (entry['type'] === 'blob') {
          ghItem.isDirectory = false;
          ghItem.isBinary = entry['object']['isBinary'];
        }
        ghItem.dirPath = dir.getFullPath();

        if (!dir.repo.config['ignoreHiddenFiles'] || !ghItem.fileName.startsWith('.')) {
          items.push(ghItem);
        }
      }

      return items;
    });
  }

  getFile(item: GitHubItem): Promise<GitHubFile> {
    return this.graphQlQuery(Queries.getFileContents(item), `fileContents ${item.fileName}`).toPromise().then(response => {
      const obj = response['data']['repository']['object'];
      if (obj === null) {
        return null;
      }
      const file = new GitHubFile(obj['text']);
      file.item = item;
      file.item.lastGet = obj['oid'];
      return file;
    });
  }

  // this stuff annoyingly has to be done with the old API. :'(
  getFileContentsFromCommit(item: GitHubItem, commit: string): Promise<string> {
    // TODO: grace
    const url = `https://api.github.com/repos/${item.repo.owner}/${item.repo.name}/contents/${item.getFullPath()}?ref=${commit}`;
    return this.http.get(
      url,
      {
        headers: new HttpHeaders().set('Authorization', 'Bearer ' + this.bearerToken)
      }
    ).toPromise()
      .then(response => {
        return atob(response['content']);
      });
  }

  getFileContentsFromOid(repo: GitHubRepo, oid: string): Promise<string> {
    return this.graphQlQuery(Queries.getOidContents(repo, oid), `oidContents`).toPromise().then(response => {
      const obj = response['data']['repository']['object'];
      if (obj === null) {
        return null;
      }
      return obj['text'];
    });
  }

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
        `${file.item.repo.owner}/${file.item.repo.name}/contents/${file.item.getFullPath()}`,
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
      const newRepo = new GitHubRepo();
      newRepo.owner = this.user.login;
      newRepo.name = response['name'];
      newRepo.isPrivate = false;
      newRepo.description = description;
      newRepo.defaultBranch = response['default_branch'];
      newRepo.lastFetchTime = Date.now();
      return {success: true, repo: newRepo};
    })
    .catch(error => {
      // TODO: grace
      console.error(error);
      return {success: false};
    });
  }

  getFileHistory(item: GitHubItem, cursor: string): Promise<object> {
    return this.graphQlQuery(Queries.getFileHistory(item, cursor), 'fileHistory').toPromise().then(response => {
      const history = [];
      const historyNode = response['data']['repository']['ref']['target']['history'];
      const entries = historyNode['nodes'];
      const pageInfo = historyNode['pageInfo'];
      for (const entry of entries) {
        let person = entry['author']['user'];
        if (person === null) {
          person = entry['committer']['user'];
        }
        history.push({
          userLogin: person ? person['login'] : null,
          userAvatar: person ? person['avatarUrl'] : null,
          commitDate: entry['committedDate'],
          message: entry['message'],
          messageHeadline: entry['messageHeadline'],
          oid: entry['oid']
        });
      }
      return {continuation: pageInfo['hasNextPage'] ? pageInfo['endCursor'] : null, history: history};
    });
  }
}
