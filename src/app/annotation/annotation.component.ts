import { Component,
         OnInit,
         AfterViewInit,
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
export class AnnotationComponent implements AfterViewInit {

  @ViewChild('annotation') annChild: ElementRef;

  @Input() ann: Annotation;
  @Input() topPos: number;

  constructor() { }

  ngAfterViewInit() {
  }

  public getDisplayHeight(): number {
    return this.annChild.nativeElement.offsetHeight;
  }

}
