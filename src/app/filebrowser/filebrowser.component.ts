import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';
import { GitHubFile,
         GitHubItem,
         GitHubRepo,
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
  ) { }

  ngOnInit() {
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
    // TODO: if in single repo mode, don't change
    // TODO: check owner/name against current repo and don't reload if unnecessary
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

  async checkRepoAndFile() {
    await this.gitHubService.loadItemData(this.item);

    // (if it's null, the check hasn't completed yet)
    if (this.item.repo.lastFetchTime === null) {
      this.router.navigateByUrl('/');
      return;
    }
    if (this.item.lastGet === null) {
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
                this.router.navigateByUrl(response['repo'].routerPath);
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
