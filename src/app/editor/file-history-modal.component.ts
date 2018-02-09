import { Component,
         AfterViewInit,
         ViewChild,
         ElementRef
       } from '@angular/core';

import { DraxModalType, DraxModalComponent } from '../drax-modal/drax-modal.component';
import { GitHubAccessComponent, GitHubItem } from '../githubaccess/githubaccess.component';

@Component({
  selector: 'app-file-history-modal',
  templateUrl: './file-history-modal.component.html',
  styleUrls: ['./file-history-modal.component.scss']
})
export class FileHistoryModalComponent implements AfterViewInit, DraxModalType {

  host: DraxModalComponent = null;

  title = '';
  description = '';

  ghAccess: GitHubAccessComponent = null;
  item: GitHubItem = null;
  continuation: string = null;
  historyData = null;

  callback: (oid: string) => void = null;

  constructor() {}

  ngAfterViewInit() {
  }

  display(data: {
            item: GitHubItem,
            ghAccess: GitHubAccessComponent,
            callback: (oid: string) => void
          }) {

    this.title = 'File History';
    this.description  = 'Select a version of this file to restore locally. ';
    this.description += 'The current version on the server will not change unless you save over it. ';
    this.description += 'Past versions are always kept.';
    this.ghAccess = data.ghAccess;
    this.item = data.item;
    this.callback = data.callback;
    this.continuation = null;
    this.historyData = [];

    this.getHistory();

    return;
  }

  getHistory() {
    this.ghAccess.getFileHistory(this.item, this.continuation).then(response => {
      this.historyData = this.historyData.concat(response['history']);
      this.continuation = response['continuation'];
    });
  }

  clickedItem(oid: string) {
    if (this.callback) {
      this.callback(oid);
    }
    this.host.close();
  }

  close() {
    this.host.close();
  }

  onScroll(event: Event) {
    if (this.historyData === null || this.historyData.length <= 0) {
      return;
    }

    if (this.continuation !== null) {
      const src = event.srcElement;
      const offset = src.scrollTop + src.clientHeight;
      const max = src.scrollHeight;

      if (max - offset < 20) {
        this.getHistory();
      }
    }
  }
}
