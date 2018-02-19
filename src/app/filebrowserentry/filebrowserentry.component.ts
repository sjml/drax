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

  private _navItem: GitHubNavNode = null;
  @Input() set navItem(newNode: GitHubNavNode) {
    this._navItem = newNode;
    this.onNavItemChange();
  }
  get navItem(): GitHubNavNode { return this._navItem; }

  iconName: string = null;
  isContainer = true;
  label: string = null;
  prefixLabel: string = null;
  selected = false;

  constructor(
    private gitHubService: GitHubService
  ) { }

  ngOnInit() {
  }

  onNavItemChange() {
    if (this.navItem instanceof GitHubRepo) {
      this.label = this.navItem.name;
      if (this.navItem.owner !== this.gitHubService.user.login) {
        this.prefixLabel = this.navItem.owner;
      }
      else {
        this.prefixLabel = null;
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
        if (this.navItem.pathMatch(this.parent.item)) {
          this.selected = true;
        }
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
