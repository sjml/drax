import { Component, OnInit, Input } from '@angular/core';

import { FileBrowserComponent } from '../filebrowser/filebrowser.component';
import { GitHubService } from '../githubservice/github.service';
import { GitHubNavNode, GitHubRepo, GitHubItem } from '../githubservice/githubclasses';

@Component({
  selector: 'app-filebrowserentry',
  templateUrl: './filebrowserentry.component.html',
  styleUrls: ['./filebrowserentry.component.scss']
})
export class FileBrowserEntryComponent implements OnInit {

  @Input() parent: FileBrowserComponent = null;
  @Input() navItem: GitHubNavNode = null;
  iconName: string = null;
  isContainer = true;
  label: string = null;
  prefixLabel: string = null;

  constructor(
    private gitHubService: GitHubService
  ) { }

  ngOnInit() {
    if (this.navItem instanceof GitHubRepo) {
      this.label = this.navItem.name;
      if (this.navItem.owner !== this.gitHubService.user.login) {
        this.prefixLabel = this.navItem.owner;
      }
      this.iconName = 'database';
    }
    else if (this.navItem instanceof GitHubItem) {
      if (this.navItem.isDirectory) {
        this.label = this.navItem.fileName;
        this.iconName = 'folder';
      }
      else {
        this.label = this.navItem.fileName;
        this.iconName = 'file';
        this.isContainer = false;
      }
    }
  }

  clicked() {
    if (this.parent === null) {
      console.error('No parent for file browser entry.');
      return;
    }
    this.parent.loadNode(this.navItem);
  }

}
