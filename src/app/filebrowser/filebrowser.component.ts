import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';
import { GitHubFile,
         GitHubItem,
         GitHubRepo,
         GitHubUser,
         GitHubNavNode
       } from '../githubservice/githubclasses';
import { GitHubService } from '../githubservice/github.service';
import { ConfigService } from '../config.service';
import { ModalService } from '../drax-modal/modal.service';
import { ModalField } from '../drax-modal/data-request-modal.component';
import { DataRequestModalComponent } from '../drax-modal/data-request-modal.component';


@Component({
  selector: 'app-filebrowser',
  templateUrl: './filebrowser.component.html',
  styleUrls: ['./filebrowser.component.scss']
})
export class FileBrowserComponent implements OnInit {
  isOpen = false;
  isInSingleRepoMode = false;

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
    private gitHubService: GitHubService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit() {
    this.gitHubService.loadCurrentUser();

    this.route.params.subscribe(_ => {
      this.loadFromLocation();
    });
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  logout() {
    localStorage.removeItem('gitHubBearerToken');
    this.workingFile = null;
    this.repo = null;
    this.currentNavList = [];
    this.router.navigateByUrl('/');
  }

  // TODO: have this take params from the subscription
  loadFromLocation() {
    const newPage = this.route.snapshot.paramMap.get('pageName');
    if (newPage !== null) {
      this.displayPage = newPage;
      this.workingFile = null;
    }

    this.repo = new GitHubRepo();
    const singleRepo = this.config.getConfig('singleRepo');
    if (singleRepo === null) {
      this.repo.owner = this.route.snapshot.paramMap.get('owner');
      this.repo.name = this.route.snapshot.paramMap.get('name');
    }
    else {
      this.isInSingleRepoMode = true;
      this.repo.owner = singleRepo.owner;
      this.repo.name = singleRepo.name;
    }

    if (!this.gitHubService.bearerToken || this.repo.owner === null || this.repo.name === null) {
      if (this.displayPage === null) {
        this.router.navigateByUrl('/');
      }
      if (this.gitHubService.bearerToken) {
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
    await this.gitHubService.getPathInfo(this.item).then(response => {
      if (response === null) {
        repoGood = false;
      }
      else if (response['object'] === null) {
        pathGood = false;
      }
      else if (!this.checkRoot(this.item.fullPath, this.repo.config['contentRoot'])) {
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
      let redirect = this.repo.routerPath;
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
      this.gitHubService.getFile(this.item).then(respFile => {
        this.workingFile = respFile;
      });
    }
  }

  loadRepo(repo: GitHubRepo): Promise<boolean> {
    if (repo === null) {
      return Promise.resolve(false);
    }
    return this.gitHubService.getSingleRepo(repo).then(response => {
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
      return this.gitHubService.getFile(item).then(fileResponse => {
        if (fileResponse !== null) {
          const remoteConfig = JSON.parse(fileResponse.contents);
          repo.config = Object.assign(repo.config, remoteConfig);
          repo.config['hasConfig'] = true;
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
    return this.gitHubService.getRepoList(cursor).then(response => {
      for (const newRepo of response.repos) {
        this.currentNavList[index++] = newRepo;
      }
      this.currentNavList.length = index;

      return response.continuation;
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
      if (item.fullPath === item.repo.config['contentRoot']) {
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
          this.upwardsLink = item.routerPathDirOnly;
        }
      }
    }
    else {
      this.upwardsLink = '/';
      this.upwardsLinkLabel = 'Repository List';
    }

    if (
        this.isInSingleRepoMode
        && this.upwardsLink === '/'
        && this.upwardsLinkLabel === 'Repository List'
      ) {
      this.upwardsLink = null;
      this.upwardsLinkLabel = null;
    }

    this.gitHubService.getFileList(item).then(itemList => {
      for (let i = 0; i < itemList.length; i++) {
        this.currentNavList[i] = itemList[i];
      }
      this.currentNavList.length = itemList.length;
    });
  }

  createNewRepoButtonResponse() {
    const fields: ModalField[] = [
      {name: 'repoName', value: '', required: true, placeholder: 'Repository Name'},
      {name: 'repoDesc', value: '', required: false, placeholder: 'Description of Repository', showAsTextArea: true}
    ];
    this.modalService.generate(DataRequestModalComponent, {
                                  display: {
                                    title: 'Create Repository',
                                    description: 'Create a new collection of files on GitHub.',
                                    fields: fields
                                  },
      callback: (pressedOK, values) => {
        if (pressedOK) {
          this.gitHubService.createRepo(values['repoName'], values['repoDesc'])
            .then(response => {
              if (!response['success']) {
                // TODO: grace
              }
              else {
                const repo = new GitHubRepo();
                repo.owner = this.gitHubService.user.login;
                repo.name = response['name'];
                this.loadRepo(repo).then((success) => {
                  if (!success) {
                    // TODO: grace
                  }
                  else {
                    this.router.navigateByUrl(repo.routerPath);
                  }
                });
              }
            });
        }
      }
    });
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
    this.modalService.generate(DataRequestModalComponent, {
                                  display: {
                                    title: `Create New ${pathType}`,
                                    description: `Create a new ${pathType.toLowerCase()} in the current folder.`,
                                    fields: fields
                                  },
      callback: (pressedOK, values) => {
        if (pressedOK) {
          const i = new GitHubItem();
          i.repo = this.repo;
          i.isDirectory = false;
          i.isBinary = false;
          i.branch = this.item.branch;
          if (this.item.isDirectory) {
            i.dirPath = this.item.fullPath;
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

          this.gitHubService.pushFile(f, values['commitMessage'], true)
                .then((response) => {
                  if (!response['success']) {
                    // TODO: grace
                    console.error(response['error']);
                  }
                  else {
                    const path = isDirectory ? f.item.routerPathDirOnly : f.item.routerPath;
                    this.router.navigateByUrl(path);
                  }
                });
        }
      }
    });
  }

}
