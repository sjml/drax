import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute, UrlSegment, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { GitHubFile,
         GitHubItem,
         GitHubRepo,
         GitHubNavNode,
         GitHubRepoList
       } from '../githubservice/githubclasses';
import { GitHubService } from '../githubservice/github.service';
import { ConfigService } from '../config.service';
import { ModalService } from '../modals/modal.service';
import { NotificationService } from '../notifications/notification.service';

import { DataRequestModalComponent, ModalField } from '../modals/data-request-modal/data-request-modal.component';
import { NotificationLevel } from '../notifications/notification';


@Component({
  selector: 'app-filebrowser',
  templateUrl: './filebrowser.component.html',
  styleUrls: ['./filebrowser.component.scss']
})
export class FileBrowserComponent implements OnInit {
  isOpen = false;
  isInSingleRepoMode = false;

  isLoading = false;

  repo: GitHubRepo = null;
  item: GitHubItem = null;

  upwardsLink: GitHubNavNode = null;
  upwardsLinkLabel: string = null;
  currentNavList: GitHubNavNode[] = [];

  private repositoryListCursor: string = null;

  constructor(
    private config: ConfigService,
    private modalService: ModalService,
    public gitHubService: GitHubService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit() {
    this.isInSingleRepoMode = this.config.getConfig('singleRepo') !== null;

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.gitHubService.getCurrentUser().then(user => {
          if (user !== null) {
            this.loadFromUrl(event.urlAfterRedirects.split('/'));
          }
        });
      }
    });
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  loginPrompt() {
    this.gitHubService.attemptAuthorization((user) => {
      if (user !== null) {
        this.loadNode(null);
      }
    });
  }

  logout() {
    this.gitHubService.logout();
    this.repo = null;
    this.currentNavList = [];
    this.upwardsLink = null;
    this.router.navigateByUrl('/');
  }

  async loadNode(node: GitHubNavNode, initial: boolean = false) {
    if (node instanceof GitHubRepo) {
      this.isLoading = true;
      await this.gitHubService.loadRepoData(node);
      this.isLoading = false;
      const item = new GitHubItem();
      item.repo = node;
      item.dirPath = null;
      item.fileName = '';
      if (node.config['contentRoot'].length > 0) {
        item.fileName = node.config['contentRoot'];
      }
      item.isDirectory = true;
      item.branch = item.repo.defaultBranch;
      this.loadNode(item);
    }
    else if (node instanceof GitHubItem) {
      this.repo = node.repo;
      this.item = node;
      if (node.isDirectory) {
        this.loadDirectoryListing(node);
      }
      else {
        if (!initial) {
          // TODO: this only loads the directory listing to get the
          //   selected color showing up. Gotta be a better way.
          this.loadDirectoryListing(node.makeParentItem());
          let baseComp = 'edit';
          if (node.isBinary) {
            baseComp = 'bin';
          }
          const segs = [baseComp].concat(node.getRouterPath());
          this.router.navigate(segs);
        }
        else {
          this.loadDirectoryListing(node.makeParentItem());
        }
      }
    }
    else {
      this.repo = null;
      this.item = null;
      this.loadRepositoryList();
    }
  }

  async loadFromUrl(url: string[]) {
    // TODO: if in single repo mode, don't change
    // TODO: check owner/name against current repo and don't reload if unnecessary
    url = url.filter(s => s.length > 0);
    const firstSeg = url.shift();
    if (firstSeg !== 'edit' && firstSeg !== 'bin') {
      this.repo = null;
      this.item = null;
      this.loadNode(null);
    }
    const segs = url.map(s => new UrlSegment(s, {}));
    const data = this.gitHubService.getDataFromUrl(segs);
    if (this.isInSingleRepoMode) {
      const singleRepo = this.config.getConfig('singleRepo');
      if (data.repo === null) {
        data.repo = new GitHubRepo();
        data.repo.owner = singleRepo.owner;
        data.repo.name = singleRepo.name;
      }
      else {
        if (data.repo.owner !== singleRepo.owner || data.repo.name !== singleRepo.name) {
          this.repo = null;
          this.item = null;
          this.loadNode(null);
          return;
        }
      }
    }
    if (data.repo === null) {
      this.repo = null;
      this.item = null;
      this.loadNode(null);
      return;
    }

    if (data.item === null) {
      this.isLoading = true;
      await this.gitHubService.loadRepoData(data.repo);
      this.isLoading = false;
      this.loadNode(data.repo);
      return;
    }

    this.isLoading = true;
    await this.gitHubService.loadItemData(data.item);
    this.isLoading = false;
    this.loadNode(data.item, true);
  }

  onScroll(event: Event) {
    if (this.currentNavList.length <= 0) {
      return;
    }

    if (this.repositoryListCursor !== null) {
      const srcEl = event.srcElement as HTMLElement;
      const offset = srcEl.scrollTop + srcEl.clientHeight;
      const max = srcEl.scrollHeight;

      if (max - offset < 20) {
        this.loadRepositoryList(this.repositoryListCursor);
      }
    }
  }

  loadRepositoryList(cursor: string = null) {
    this.repo = null;
    this.item = null;
    this.upwardsLink = null;
    this.upwardsLinkLabel = null;

    let index = 0;
    if (cursor !== null) {
      index = this.currentNavList.length;
    }
    this.isLoading = true;
    this.gitHubService.getRepoList(cursor).then(response => {
      this.isLoading = false;
      if (response !== null) {
        for (const newRepo of response.repos) {
          this.currentNavList[index++] = newRepo;
        }
        this.currentNavList.length = index;

        this.repositoryListCursor = response.continuation;
      }
    });
  }

  async loadDirectoryListing(item: GitHubItem) {
    if (!item.isDirectory) {
      console.error('Cannot load listing of non-directory.');
      return;
    }

    this.isLoading = true;
    await this.gitHubService.loadItemData(this.item);
    this.isLoading = false;

    if (item.dirPath !== null) {
      if (item.getFullPath() === item.repo.config['contentRoot']) {
        this.upwardsLink = new GitHubRepoList();
      }
      else if (item.dirPath.length === 0) {
        this.upwardsLink = item.repo;
      }
      else {
        this.upwardsLink = item.makeParentItem();
      }
    }
    else {
      this.upwardsLink = new GitHubRepoList();
    }

    if (this.upwardsLink instanceof GitHubRepo) {
      this.upwardsLinkLabel = `${this.upwardsLink.owner}/${this.upwardsLink.name}:${item.branch}`;
    }
    else if (this.upwardsLink instanceof GitHubItem) {
      this.upwardsLinkLabel = this.upwardsLink.fileName;
    }
    else if (this.upwardsLink instanceof GitHubRepoList) {
      this.upwardsLinkLabel = 'Repository List';
    }

    this.repositoryListCursor = null;
    this.isLoading = true;
    const itemList = await this.gitHubService.getFileList(item);
    this.isLoading = false;
    if (itemList) {
      for (let i = 0; i < itemList.length; i++) {
        this.currentNavList[i] = itemList[i];
      }
      this.currentNavList.length = itemList.length;
    }
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
                this.notificationService.notify(
                  'GitHub Error',
                  'Couldn\'t create new repository for some reason. Try again?',
                  5000,
                  NotificationLevel.Error
                );
                console.error(response['error']);
              }
              else {
                this.loadNode(response['repo']);
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
            i.dirPath = this.item.getFullPath();
          }
          else {
            i.dirPath = this.item.dirPath;
          }
          if (isDirectory) { // creating new directory
            i.dirPath += `/${values['pathName']}`;
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
                    this.notificationService.notify(
                      'GitHub Error',
                      `Couldn\'t create new ${pathType.toLowerCase()} for some reason. Try again?`,
                      5000,
                      NotificationLevel.Error
                    );
                    console.error(response['error']);
                  }
                  else {
                    if (isDirectory) {
                      const enclosingFolder = f.item.makeParentItem().makeParentItem();
                      this.loadNode(enclosingFolder);
                    }
                    else {
                      this.loadDirectoryListing(f.item.makeParentItem());
                      this.loadNode(f.item);
                    }
                  }
                });
        }
      }
    });
  }

}
