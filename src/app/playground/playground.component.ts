import { Component, AfterViewInit, ViewChild } from '@angular/core';

import { EditorComponent } from '../editor/editor.component';
import { Annotation } from '../annotation/annotation';
import { AnnotationComponent } from '../annotation/annotation.component';

import * as CodeMirror from 'codemirror';
import * as fns from 'date-fns';

const pgmd = require('!raw-loader!./playground.md');

interface SampleAnnotation {
  name: string;
  from: {line: number, ch: number};
  to: {line: number, ch: number};
  text: string;
  stamp: number;
}

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements AfterViewInit {

  @ViewChild(EditorComponent)
  editor: EditorComponent = null;

  constructor() { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setupPlayground();
    });
  }

  setupPlayground() {
    this.editor.instance.setValue(pgmd);
    this.editor.instance.refresh();

    const doc = this.editor.instance.getDoc();
    doc.clearHistory();

    const sampleAnnotations: SampleAnnotation[] = [
      {
        name: 'Alice',
        from: {line: 18, ch: 62},
        to:   {line: 18, ch: 67},
        text: 'I always preferred the UK spelling. Can we change this to "colour?"',
        stamp: fns.subDays(Date.now(), 2).getTime()
      },
      {
        name: 'Bob',
        from: {line: 18, ch: 107},
        to:   {line: 18, ch: 120},
        text: 'This shouldn\'t be italicized, if I remember my typographical rules.',
        stamp: fns.subDays(Date.now(), 4).getTime()
      },
      {
        name: 'Richard',
        from: {line: 18, ch: 155},
        to:   {line: 18, ch: 170},
        text: 'This is confusing. Either call them annotations or call them comments, but just pick one!',
        stamp: fns.subDays(Date.now(), 1).getTime()
      },
      {
        name: 'Margaret',
        from: {line: 18, ch: 186},
        to:   {line: 18, ch: 195},
        text: 'It might be best to avoid politics if we can.',
        stamp: fns.subHours(Date.now(), 2).getTime()
      }
    ];

    const anns: Annotation[] = [];
    for (const sample of sampleAnnotations) {
      const ann = new Annotation();
      ann.author = sample.name;
      ann.from = CodeMirror.Pos(sample.from.line, sample.from.ch);
      ann.to = CodeMirror.Pos(sample.to.line, sample.to.ch);
      ann.marker = doc.markText(ann.from, ann.to, {
        className: `annotation color${AnnotationComponent.getColorIndex(ann.author)}`,
        startStyle: 'annotationStart',
        endStyle: 'annotationEnd',
        inclusiveLeft: ann.from.ch > 0,
        inclusiveRight: ann.to.ch < doc.getLine(ann.to.line).length
      });
      ann.extents = this.editor.instance.cursorCoords(ann.from);
      ann.text = sample.text;
      ann.timestamp = sample.stamp;

      anns.push(ann);
    }
    this.editor.annotations = anns;
    this.editor.toggleAnnotationGutter(true);

    setTimeout(() => {
      this.editor.updateAnnotations();
      this.editor.change.emit();
    });
  }

}
