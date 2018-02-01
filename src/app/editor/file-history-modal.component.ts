import { Component,
         AfterViewInit
       } from '@angular/core';

import { DraxModalType, DraxModalComponent } from '../drax-modal/drax-modal.component';

@Component({
  selector: 'app-file-history-modal',
  templateUrl: './file-history-modal.component.html',
  styleUrls: ['./file-history-modal.component.scss']
})
export class FileHistoryModalComponent implements AfterViewInit, DraxModalType {

  host: DraxModalComponent = null;

  title = '';
  description = '';

  continuation: string = null;
  historyData = null;

  callback: (oid: string) => void = null;

  constructor() {}

  ngAfterViewInit() {
  }

  display(data: {
            historyData: any,
            callback: (oid: string) => void
          }) {

    this.title = 'File History';
    this.description  = 'Select a version of this file to restore locally. ';
    this.description += 'The current version on the server will be safe unless you save over it. ';
    this.description += 'Past versions are always kept.';
    this.historyData = data.historyData;
    this.callback = data.callback;

    return;
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
}
