import { Component,
         AfterViewInit,
         ViewChild,
         ViewChildren,
         Input,
         QueryList,
         ElementRef,
         HostListener
       } from '@angular/core';

import { Annotation } from '../annotation/annotation';
import { AnnotationComponent } from '../annotation/annotation.component';

import * as c from 'cassowary';

@Component({
  selector: 'app-annotation-container',
  templateUrl: './annotation-container.component.html',
  styleUrls: ['./annotation-container.component.scss']
})
export class AnnotationContainerComponent implements AfterViewInit {

  private _visible = true;
  set visible(vis: boolean) {
    this._visible = vis;
    // setTimeout(() => {
    //   if (this.visible) {
    //     this.calculatePositions();
    //   }
    // });
  }
  get visible(): boolean {
    return this._visible;
  }

  @ViewChildren(AnnotationComponent)
  annChildren: QueryList<AnnotationComponent> = null;

  private _annotations: Annotation[];
  get annotations(): Annotation[] {
    return this._annotations;
  }

  @Input()
  set annotations(annotations: Annotation[]) {
    this._annotations = annotations;
    this._annotations.sort(this.annSort);
  }

  @ViewChild('svgAnnotationLines')
  private _svgAnnLines: ElementRef;
  lines: string[] = [];

  @HostListener('window:resize') onResize() {
    this.updateSize();
  }

  constructor() { }

  ngAfterViewInit() {
    this.updateSize();
  }

  private updateSize() {
    this._svgAnnLines.nativeElement.setAttribute('width', document.body.clientWidth);
    this._svgAnnLines.nativeElement.setAttribute('height', document.body.clientHeight);
  }

  calculatePositions() {
    if (!this._visible) {
      return;
    }
    if (this.annChildren.length === 0) {
      this.clearLines();
      return;
    }

    // console.log('calculating positions');
    const margin = 2;
    const start = 90;
    const datums: AnnotationComponent[] = this.annChildren.toArray();

    const solver = new c.SimplexSolver();
    solver.autoSolve = false;

    const tops: c.Variable[] = [];

    for (let i = 0; i < datums.length; i++) {
      const annComp = datums[i];
      const top = new c.Variable({
        value: annComp.ann.extents.top,
      });
      annComp.topVar = top;
      solver.addStay(top, c.Strength.weak);
      tops.push(top);

      const height = new c.Variable({
        value: annComp.getDisplayHeight(),
      });

      if (i === 0) {
        solver.addConstraint(new c.Inequality(
                                    top,
                                    c.GEQ,
                                    start + margin),
                                    c.Strength.required
                            );
      }
      else {
        const last = datums[i - 1];
        solver.addConstraint(new c.Inequality(
                                    top,
                                    c.GEQ,
                                    c.plus(
                                      c.plus(
                                        last.topVar,
                                        last.getDisplayHeight()
                                      ),
                                      margin)
                                  ),
                                  c.Strength.required
                            );
      }

      // solver.addConstraint(new c.Inequality(
      //                             top,
      //                             c.GEQ,
      //                             annComp.ann.extents.top
      //                           ),
      //                           c.Strength.weak
      //                     );
    }

    solver.resolve();

    for (const annComp of datums) {
      annComp.topPos = annComp.topVar.value;
    }

    this.drawLines();
  }

  clearLines() {
    this.lines = [];
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
