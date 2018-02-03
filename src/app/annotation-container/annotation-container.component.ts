import { Component,
         AfterViewInit,
         ViewChild,
         ViewChildren,
         Input,
         QueryList,
         ElementRef
       } from '@angular/core';

import { Annotation } from '../annotation/annotation';
import { AnnotationComponent } from '../annotation/annotation.component';

@Component({
  selector: 'app-annotation-container',
  templateUrl: './annotation-container.component.html',
  styleUrls: ['./annotation-container.component.scss']
})
export class AnnotationContainerComponent implements AfterViewInit {

  @ViewChildren(AnnotationComponent)
  annChildren: QueryList<AnnotationComponent> = null;
  changeSubscription = null;

  private _annotations: Annotation[];
  get annotations(): Annotation[] {
    return this._annotations;
  }

  @ViewChild('svgAnnotationLines')
  private _svgAnnLines: ElementRef;
  lines: string[] = [];

  @Input()
  set annotations(annotations: Annotation[]) {
    this._annotations = annotations;
    this._annotations.sort(this.annSort);
  }

  constructor() { }

  ngAfterViewInit() {
    this._svgAnnLines.nativeElement.setAttribute('width', document.body.clientWidth);
    this._svgAnnLines.nativeElement.setAttribute('height', document.body.clientHeight);

    this.changeSubscription = this.annChildren.changes.subscribe(
      () => setTimeout(() => this.calculatePositions())
    );
  }

  calculatePositions() {
    function intersects(self: AnnotationContainerComponent, a: AnnotationComponent, b: AnnotationComponent): boolean {
      if (a.ann.extents.top + a.getDisplayHeight() >= b.ann.extents.top && b.ann.extents.top + b.getDisplayHeight() >= a.ann.extents.top) {
        return true;
      }
      return false;
    }

    const datums: AnnotationComponent[] = this.annChildren.toArray();
    if (datums.length === 0) {
      return;
    }
    if (this.changeSubscription) {
      this.changeSubscription.unsubscribe();
      this.changeSubscription = null;
    }
    const overlapGroups: Set<AnnotationComponent>[] = [];
    for (const i of datums) {
      for (const j of datums) {
        if (i === j) {
          continue;
        }
        if (intersects(this, i, j)) {
          let inserted = false;
          for (const group of overlapGroups) {
            if (group.has(i) || group.has(j)) {
              group.add(i);
              group.add(j);
              inserted = true;
              break;
            }
          }
          if (!inserted) {
            overlapGroups.push(new Set<AnnotationComponent>([i, j]));
          }
        }
      }
    }

    const margin = 2;
    for (const group of overlapGroups) {
      if (group.size === 0) {
        continue; // shouldn't happen, but being safe
      }
      let totalHeight = 0;
      let start = 0;
      const orderedSet = Array.from(group).sort(this.annSort);
      for (const a of orderedSet) {
        totalHeight += a.getDisplayHeight() + margin;
        start += a.ann.extents.top;
      }
      start /= orderedSet.length;
      let currY = start - (totalHeight * 0.3);
      for (const a of orderedSet) {
        a.topPos = currY;
        currY += a.getDisplayHeight() + margin;
      }
    }

    this.drawLines();
  }

  private drawLines() {
    this.lines = [];
    this.annChildren.forEach((a) => {
      this.lines.push(a.getPointString());
    });
  }

  private annSort(a: Annotation | AnnotationComponent, b: Annotation | AnnotationComponent): number {
    if (a instanceof AnnotationComponent ) {
      a = a.ann;
    }
    if (b instanceof AnnotationComponent) {
      b = b.ann;
    }
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
