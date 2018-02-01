import { Component,
         OnInit,
         Input,
         ViewChild,
         ElementRef
        } from '@angular/core';

import { Annotation } from '../editor/editor.component';

@Component({
  selector: 'app-annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.scss']
})
export class AnnotationComponent implements OnInit {

  @ViewChild('annotation') annChild: ElementRef;

  @Input() ann: Annotation;

  topPos: number;

  constructor() { }

  ngOnInit() {
    this.topPos = this.ann.extents.top;
  }

  public getDisplayHeight(): number {
    return this.annChild.nativeElement.offsetHeight;
  }

}
