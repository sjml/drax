import { Component, OnInit } from '@angular/core';

import { DraxModalType, DraxModalComponent } from '../drax-modal/drax-modal.component';
import { GitHubFile, GitHubItem } from '../../githubservice/githubclasses';
import { Annotation, AdjustAnnotations, AnnotationSort } from '../../annotations/annotation/annotation';
import { GitHubService } from '../../githubservice/github.service';
import { NotificationLevel } from '../../notifications/notification';
import { NotificationService } from '../../notifications/notification.service';

import * as Diff3 from 'node-diff3';
import * as uuid from 'uuid';

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
  outputAnnotations: Annotation[] = [];
  oldFile: GitHubFile = null;
  newFile: GitHubFile = null;
  newAnnFile: GitHubFile = null;
  callback: (pressedOK: boolean,
    newContents: string,
    newFile: GitHubFile,
    newAnnotations: Annotation[],
    annLastGet: string
  ) => void = null;

  constructor(
    private ghService: GitHubService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
  }

  async display(data: {
            ghFile: GitHubFile,
            annData: {
              annotations: Annotation[],
              outOfSync: boolean,
              originalAnnotations: Annotation[]
            },
            callback: (pressedOK: boolean,
              newContents: string,
              newFile: GitHubFile,
              newAnnotations: Annotation[],
              annLastGet: string
            ) => void
          }) {
    this.callback = data.callback;
    this.oldFile = data.ghFile;

    this.newFile = await this.ghService.getFile(this.oldFile.item);
    const newerContents = this.newFile.contents;
    const currentContents = this.oldFile.contents;
    const parentContents = this.oldFile.pristine;


    const annItem = new GitHubItem();
    annItem.repo = this.newFile.item.repo;
    annItem.branch = this.newFile.item.branch;
    annItem.dirPath = `.drax/annotations${this.newFile.item.dirPath}`;
    annItem.fileName = `${this.newFile.item.fileName}.json`;
    this.newAnnFile = await this.ghService.getFile(annItem);

    const newerAnnotations = JSON.parse(this.newAnnFile.contents).annotations as Annotation[];
    const currentAnnotations = data.annData.annotations.slice(0);
    const parentAnnotations = data.annData.originalAnnotations.slice(0);


    if (currentContents === parentContents && !data.annData.outOfSync) {
      this.title = 'Refresh File?';
      this.description = 'You haven\'t made any changes yet. Do you want to get the latest version from the repository?';
      this.outputContents = newerContents;
      this.outputAnnotations = newerAnnotations;
    }
    else {
      const mergeAttempt = Diff3.merge(currentContents, parentContents, newerContents);

      if (mergeAttempt.conflict) {
        this.title = 'Refresh File?';
        this.description = 'The file in the repository has changes that conflict with yours. ';
        this.description += 'Click OK to accept their version, or Cancel to keep your current work. ';
        this.description += 'CLICKING OK WILL DISCARD YOUR CURRENT WORK.';
        this.outputContents = newerContents;
        this.outputAnnotations = newerAnnotations;
      }
      else {
        this.title = 'Accept Changes?';
        this.description = 'The changes from the repository are able to merge unobtrustively with yours.';
        this.outputContents = mergeAttempt.result.join('');

        // now merging annotations...
        const newBased: Annotation[] = [];
        const currentBased: Annotation[] = [];
        const parentBased: Annotation[] = [];

        let oldAnnCount = currentAnnotations.filter(a => !a.uuid).length;
        oldAnnCount += parentAnnotations.filter(a => !a.uuid).length;
        oldAnnCount += newerAnnotations.filter(a => !a.uuid).length;
        if (oldAnnCount > 0) {
          // just take all the newer ones
          newBased.concat(newerAnnotations);
          return;
        }

        for (const parentAnn of parentAnnotations) {
          const fromNewer = newerAnnotations.find(a => a.uuid === parentAnn.uuid);
          const fromCurrent = currentAnnotations.find(a => a.uuid === parentAnn.uuid);
          if (!fromNewer) { // if it doesn't exist in the newer:
            if (!fromCurrent) {
              // if it also doesn't exist in the current set, no-op (don't pass it on)
            }
            else if (fromCurrent.text === parentAnn.text) {
              // if it does exist in the current set, but is unchanged, remove it
              currentAnnotations.splice(currentAnnotations.indexOf(fromCurrent), 1);
            }
            else {
              // if it exists and is changed in current, accept current change and keep it
              currentAnnotations.splice(currentAnnotations.indexOf(fromCurrent), 1);
              currentBased.push(fromCurrent);
            }
          }
          else { // if it does exist in newer:
            if (!fromCurrent) {
              // it's not in the current set
              if (parentAnn.text !== fromNewer.text) {
                // if there's a change between base and newer, take newer
                newerAnnotations.splice(newerAnnotations.indexOf(fromNewer), 1);
                newBased.push(fromNewer);
              }
              else {
                // otherwise don't pass it on
                newerAnnotations.splice(newerAnnotations.indexOf(fromNewer), 1);
              }
            }
            else {
              // it IS in the current set
              newerAnnotations.splice(newerAnnotations.indexOf(fromNewer), 1);
              currentAnnotations.splice(currentAnnotations.indexOf(fromCurrent), 1);

              if (fromNewer.text !== fromCurrent.text) {
                // if newer and current are different, keep both as separate (generate new uuid)
                fromCurrent.uuid = uuid.v4();
                currentBased.push(fromCurrent);
                newBased.push(fromNewer);
              }
              else {
                // take the newer
                newBased.push(fromNewer);
              }
            }
          }
        }
        for (const fromNewer of newerAnnotations) {
          // any remaining in newer must be purely new, add in directly
          newBased.push(fromNewer);
        }
        for (const fromCurrent of currentAnnotations) {
          // same for any remaining in current
          currentBased.push(fromCurrent);
        }

        // adjust positioning
        const newAdjusted = AdjustAnnotations(newBased, newerContents, this.outputContents);
        const currentAdjusted = AdjustAnnotations(currentBased, currentContents, this.outputContents);
        const parentAdjusted = AdjustAnnotations(parentBased, parentContents, this.outputContents);

        // assemble final list
        this.outputAnnotations = newAdjusted.concat(currentAdjusted).concat(parentAdjusted);
        this.outputAnnotations.sort(AnnotationSort);
      }
    }

  // .catch((e) => {
  //   console.error(e);
  //   this.notificationService.notify(
  //     'GitHub Error',
  //     `Couldn\'t get "${this.oldFile.item.fileName}" from respository.`,
  //     7000,
  //     NotificationLevel.Error
  //   );
  //   this.host.close();
  // })
  }

  pressedOK() {
    if (this.callback) {
      this.callback(true, this.outputContents, this.newFile, this.outputAnnotations, this.newAnnFile.item.lastGet);
    }
    this.host.close();
  }

  pressedCancel() {
    if (this.callback) {
      this.callback(false, null, null, null, null);
    }
    this.host.close();
  }

}
