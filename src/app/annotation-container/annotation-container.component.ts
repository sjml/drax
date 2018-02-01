import { Component, AfterViewInit, ViewChildren, Input, QueryList } from '@angular/core';

import { Annotation } from '../editor/editor.component';
import { AnnotationComponent } from '../annotation/annotation.component';

@Component({
  selector: 'app-annotation-container',
  templateUrl: './annotation-container.component.html',
  styleUrls: ['./annotation-container.component.scss']
})
export class AnnotationContainerComponent implements AfterViewInit {

  @ViewChildren(AnnotationComponent) annChildren: QueryList<AnnotationComponent>;

  private _annotations: Annotation[];
  get annotations(): Annotation[] {
    return this._annotations;
  }

  @Input()
  set annotations(annotations: Annotation[]) {
    this._annotations = annotations;
    this._annotations.sort(this.annSort);
  }


  constructor() { }

  ngAfterViewInit() {
    this.annChildren.changes.subscribe(
      () => this.calculatePositions()
    );
  }

  calculatePositions() {
    for (const annChild of this.annChildren.toArray()) {
      console.log(annChild.getDisplayHeight(), annChild.ann.extents.top);
    }
  }

  private annSort(a: Annotation, b: Annotation): number {
    if (a.extents.top < b.extents.top) {
      return -1;
    }
    if (a.extents.top === b.extents.top) {
      if (a.extents.left < b.extents.left) {
        return -1;
      }
      if (a.extents.left === b.extents.left) {
        if (a.timestamp < b.timestamp) {
          return -1;
        }
        else {
          return 1;
        }
      }
    }
    return 1;
  }
}
