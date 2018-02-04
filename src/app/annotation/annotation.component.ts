import { Component,
         OnInit,
         Input,
         ViewChild,
         ElementRef
        } from '@angular/core';

import { Annotation } from './annotation';
import * as c from 'cassowary';

@Component({
  selector: 'app-annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.scss']
})
export class AnnotationComponent implements OnInit {

  @ViewChild('annotation') annChild: ElementRef;
  @ViewChild('textArea') textArea: ElementRef;

  @Input() ann: Annotation;

  topPos: number;
  topVar: c.Variable;

  editing = false;

  constructor() { }

  ngOnInit() {
    this.topPos = this.ann.extents.top;
  }

  public getDisplayHeight(): number {
    return this.annChild.nativeElement.offsetHeight;
  }

  public getPointString(): string {
    const leftPos = this.annChild.nativeElement.offsetLeft;
    return (leftPos + 5) + ',' + this.topPos
           + ' ' + this.ann.extents.left + ',' + this.ann.extents.top;
  }

  tryEdit() {
    if (!this.editing) {
      this.editing = true;
      setTimeout(() => {
        this.textArea.nativeElement.focus();
      });
    }
  }

  stopEdit() {
    if (this.editing) {
      this.editing = false;
    }
  }
}
