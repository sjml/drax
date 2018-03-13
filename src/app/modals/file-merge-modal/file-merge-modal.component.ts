import { Component, OnInit } from '@angular/core';

import { DraxModalType, DraxModalComponent } from '../drax-modal/drax-modal.component';
import { GitHubFile } from '../../githubservice/githubclasses';
import { GitHubService } from '../../githubservice/github.service';
import { NotificationLevel } from '../../notifications/notification';
import { NotificationService } from '../../notifications/notification.service';

import * as Diff3 from 'node-diff3';

@Component({
  selector: 'app-file-merge-modal',
  templateUrl: './file-merge-modal.component.html',
  styleUrls: ['./file-merge-modal.component.scss']
})
export class FileMergeModalComponent implements OnInit, DraxModalType {

  host: DraxModalComponent = null;

  title = '';
  description = '';
  outputContents = '';
  oldFile: GitHubFile = null;
  newfile: GitHubFile = null;
  callback: (pressedOK: boolean, newContents: string, newFile: GitHubFile) => void = null;

  constructor(
    private ghService: GitHubService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
  }

  display(data: {
            ghFile: GitHubFile,
            callback: (pressedOK: boolean, newContents: string, newFile: GitHubFile) => void
          }) {
    this.callback = data.callback;
    this.oldFile = data.ghFile;

    this.ghService.getFile(this.oldFile.item)
      .then(newFile => {
        this.newfile = newFile;
        const newerContents = this.newfile.contents;
        const currentContents = this.oldFile.contents;
        const parentContents = this.oldFile.pristine;

        if (currentContents === parentContents) {
          this.title = 'Refresh File?';
          this.description = 'You haven\'t made any changes yet. Do you want to get the latest version from the repository?';
          this.outputContents = newerContents;
        }
        else {
          const mergeAttempt = Diff3.merge(currentContents, parentContents, newerContents);

          if (!mergeAttempt.conflict) {
            this.title = 'Accept Changes?';
            this.description = 'The changes from the repository are able to merge unobtrustively with yours.';
            this.outputContents = mergeAttempt.result.join('');
          }
          else {
            this.title = 'Refresh File?';
            this.description = 'The file in the repository has changes that conflict with yours. ';
            this.description += 'Click OK to accept their version, or Cancel to keep your current work. ';
            this.description += 'CLICKING OK WILL DISCARD YOUR CURRENT WORK.';
            this.outputContents = newerContents;
          }
        }
      })
      .catch((e) => {
        console.error(e);
        this.notificationService.notify(
          'GitHub Error',
          `Couldn\'t get "${this.oldFile.item.fileName}" from respository.`,
          7000,
          NotificationLevel.Error
        );
        this.host.close();
      })
    ;
  }

  pressedOK() {
    if (this.callback) {
      this.callback(true, this.outputContents, this.newfile);
    }
    this.host.close();
  }

  pressedCancel() {
    if (this.callback) {
      this.callback(false, null, null);
    }
    this.host.close();
  }

}
