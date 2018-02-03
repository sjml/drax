import { Component,
         OnInit,
         AfterViewInit,
         Input,
         ViewChild,
         ElementRef
        } from '@angular/core';

import { Annotation } from './annotation';

@Component({
  selector: 'app-annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.scss']
})
export class AnnotationComponent implements OnInit, AfterViewInit {

  @ViewChild('annotation') annChild: ElementRef;

  @Input() ann: Annotation;

  topPos: number;

  constructor() { }

  ngOnInit() {
    this.topPos = this.ann.extents.top;
  }

  ngAfterViewInit() {
  }

  public getDisplayHeight(): number {
    return this.annChild.nativeElement.offsetHeight;
  }

  public getPointString(): string {
    const leftPos = this.annChild.nativeElement.offsetLeft;
    return (leftPos + 5) + ',' + this.topPos
           + ' ' + this.ann.extents.left + ',' + this.ann.extents.top;
  }

}
