import { Component,
         AfterViewInit,
         OnInit,
         Input,
         ViewChild,
         ElementRef,
         EventEmitter
        } from '@angular/core';

import { Annotation } from './annotation';
import * as c from 'cassowary';
import * as fns from 'date-fns';

@Component({
  selector: 'app-annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.scss']
})
export class AnnotationComponent implements OnInit, AfterViewInit {

  @ViewChild('annotation') annChild: ElementRef;
  @ViewChild('textArea') textArea: ElementRef;

  @Input() ann: Annotation;

  change = new EventEmitter();
  topVar: c.Variable;
  heightVar: c.Variable;

  editing = false;
  oldText = '';

  constructor() { }

  ngOnInit() {
    this.topVar = new c.Variable({value: this.ann.extents.top});
    this.heightVar = new c.Variable();
  }

  ngAfterViewInit() {
    this.heightVar.value = this.annChild.nativeElement.offsetHeight;

    if (this.ann.timestamp === 0) {
      this.tryEdit();
    }
  }

  resetVars() {
    this.topVar.value = this.ann.extents.top;
    this.heightVar.value = this.annChild.nativeElement.offsetHeight;
  }

  public getPointString(): string {
    const leftPos = this.annChild.nativeElement.offsetLeft;
    return (leftPos + 5) + ',' + this.topVar.value
           + ' ' + this.ann.extents.left + ',' + this.ann.extents.top;
  }

  getShortDateString(): string {
    if (this.ann.timestamp === 0) {
      return '';
    }
    return `${fns.distanceInWordsToNow(this.ann.timestamp)} ago`;
  }

  getFullDateString(): string {
    if (this.ann.timestamp === 0) {
      return '';
    }
    return fns.format(this.ann.timestamp, 'MMM D, YYYY, h:mm a');
  }

  tryEdit() {
    if (!this.editing) {
      this.editing = true;
      this.oldText = this.ann.text;
      setTimeout(() => {
        this.textArea.nativeElement.focus();
      });
    }
  }

  stopEdit() {
    if (this.editing) {
      this.editing = false;
      if (this.ann.text.length > 0 && this.oldText !== this.ann.text) {
        this.ann.timestamp = Date.now();
      }
      this.change.emit();
    }
  }

  removeMe() {
    this.ann.text = '';
    this.ann.timestamp = 0;
    this.change.emit();
  }
}
