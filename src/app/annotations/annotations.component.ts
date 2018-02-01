import { Component, OnInit, Input } from '@angular/core';

import { Annotation } from '../editor/editor.component';

@Component({
  selector: 'app-annotations',
  templateUrl: './annotations.component.html',
  styleUrls: ['./annotations.component.scss']
})
export class AnnotationsComponent implements OnInit {

  private _annotations: Annotation[];
  get annotations(): Annotation[] {
    return this._annotations;
  }

  @Input()
  set annotations(annotations: Annotation[]) {
    this._annotations = annotations;
  }


  constructor() { }

  ngOnInit() {
  }

  setDesiredHeights(): void {
    for (const ann of this._annotations) {
    }
  }

}
