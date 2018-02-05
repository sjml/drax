import { Component,
         AfterViewInit,
         ViewChild,
         ViewChildren,
         Input,
         QueryList,
         ElementRef,
         HostListener,
       } from '@angular/core';

import { Annotation, AnnotationSort } from '../annotation/annotation';
import { AnnotationComponent } from '../annotation/annotation.component';

import * as c from 'cassowary';

@Component({
  selector: 'app-annotation-container',
  templateUrl: './annotation-container.component.html',
  styleUrls: ['./annotation-container.component.scss']
})
export class AnnotationContainerComponent implements AfterViewInit {

  private _solver: c.SimplexSolver = null;

  private _visible = true;
  get visible(): boolean {
    return this._visible;
  }
  set visible(v: boolean) {
    this._visible = v;
    if (!v) {
      this.annChildren.forEach((annComp) => {
        if (annComp.editing) {
          annComp.stopEdit();
        }
      });
    }
  }

  private _childChanges = [];
  @ViewChildren(AnnotationComponent)
  annChildren: QueryList<AnnotationComponent> = null;

  private _annotations: Annotation[];
  get annotations(): Annotation[] {
    return this._annotations;
  }

  @Input()
  set annotations(annotations: Annotation[]) {
    this._annotations = annotations;
    this._annotations.sort(AnnotationSort);
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

    this.annChildren.changes.subscribe(() => {
      this._childChanges.map((changes) => changes.unsubscribe());
      this._childChanges = [];

      this.annChildren.forEach((annComp) => {
        this._childChanges.push(annComp.change.subscribe(() => {
          if (annComp.ann.text.length === 0 && annComp.ann.timestamp === 0) {
            this.removeAnnotation(annComp.ann);
          }
          else {
            this.calculatePositions();
          }
        }));
      });
    });
  }

  private updateSize() {
    this._svgAnnLines.nativeElement.setAttribute('width', document.body.clientWidth);
    this._svgAnnLines.nativeElement.setAttribute('height', document.body.clientHeight);
  }

  removeAnnotation(ann: Annotation) {
    ann.marker.clear();
    this.annotations.splice(this.annotations.indexOf(ann), 1);
    setTimeout(() => {
      this.calculatePositions();
    });
  }

  calculatePositions() {
    if (!this.visible) {
      return;
    }
    if (this.annChildren.length === 0) {
      this.clearLines();
      return;
    }

    const margin = 2;
    const start = 90;
    const datums: AnnotationComponent[] = this.annChildren.toArray();

    // console.log('calculating positions');
    this._solver = new c.SimplexSolver();
    this._solver.autoSolve = false;

    for (let i = 0; i < datums.length; i++) {
      const annComp = datums[i];
      annComp.resetVars();
      this._solver.addStay(annComp.topVar, c.Strength.weak);
      this._solver.addStay(annComp.heightVar, c.Strength.required);

      if (i === 0) {
        this._solver.addConstraint(new c.Inequality(
                                    annComp.topVar,
                                    c.GEQ,
                                    start + margin),
                                    c.Strength.required
                            );
      }
      else {
        const last = datums[i - 1];
        this._solver.addConstraint(new c.Inequality(
                                    annComp.topVar,
                                    c.GEQ,
                                    c.plus(
                                      c.plus(
                                        last.topVar,
                                        last.heightVar
                                      ),
                                      margin)
                                  ),
                                  c.Strength.required
                            );
      }
    }

    this._solver.resolve();

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
}
