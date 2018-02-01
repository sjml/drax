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
    interface PosData {
      ann: AnnotationComponent;
      height: number;
      top: number;
    }

    function intersects(self: AnnotationContainerComponent, a: PosData, b: PosData): boolean {
      if (a.top + a.height >= b.top && b.top + b.height >= a.top) {
        return true;
        // if (self.annSort(a.ann.ann, b.ann.ann) < 0) {
        //   return {a: a, b: b};
        // }
        // else {
        //   return {a: b, b: a};
        // }
      }
      return false;
    }

    const datums: PosData[] = [];
    for (const annChild of this.annChildren.toArray()) {
      datums.push({ann: annChild, height: annChild.getDisplayHeight(), top: annChild.ann.extents.top});
    }
    const overlaps: {a: PosData, b: PosData}[] = [];
    for (const i of datums) {
      for (const j of datums) {
        if (i === j) {
          continue;
        }
        if (intersects(this, i, j)) {
          let found = false;
          for (const q of overlaps) {
            if (q.a.ann === j.ann && q.b.ann === i.ann) {
              found = true;
              break;
            }
          }
          if (!found) {
            overlaps.push({a: i, b: j});
          }
        }
      }
    }

    for (const o of overlaps) {
      console.log('A:', o.a.ann.ann.text, 'B:', o.b.ann.ann.text);
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
