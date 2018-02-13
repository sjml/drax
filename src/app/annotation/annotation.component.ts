import { Component,
         AfterViewInit,
         OnInit,
         OnDestroy,
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
export class AnnotationComponent implements OnInit, AfterViewInit, OnDestroy {

  private static _currentColorIndex = 0;
  private static _maxColorIndex = 5;
  private static _nameColorMapping = {};

  @ViewChild('annotation') annChild: ElementRef;
  @ViewChild('textArea') textArea: ElementRef;

  @Input() ann: Annotation;

  change = new EventEmitter();
  topVar: c.Variable;
  heightVar: c.Variable;

  editing = false;
  oldText = '';

  checkInterval: number = null;
  fullDateString = '';
  shortDateString = '';
  colorString = '';

  static getColorIndex(name: string): number {
    if (name in AnnotationComponent._nameColorMapping) {
      return AnnotationComponent._nameColorMapping[name];
    }
    AnnotationComponent._currentColorIndex += 1;
    if (AnnotationComponent._currentColorIndex > AnnotationComponent._maxColorIndex) {
      AnnotationComponent._currentColorIndex = 1;
    }
    AnnotationComponent._nameColorMapping[name] = AnnotationComponent._currentColorIndex;
    return AnnotationComponent._currentColorIndex;
  }


  constructor() { }

  ngOnInit() {
    this.topVar = new c.Variable({value: this.ann.extents.top});
    this.heightVar = new c.Variable();

    if (this.ann.timestamp === 0) {
      this.editing = true;
      this.oldText = this.ann.text;
    }

    this.setStrings();
    this.checkInterval = window.setInterval(() => this.setStrings(), 60 * 1000);
  }

  ngAfterViewInit() {
    this.heightVar.value = this.annChild.nativeElement.offsetHeight;

    if (this.editing) {
      this.textArea.nativeElement.focus();
    }
  }

  ngOnDestroy() {
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
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

  setStrings() {
    if (this.ann.timestamp === 0) {
      this.shortDateString = '';
      this.fullDateString = '';
    }
    else {
      this.shortDateString = `${fns.distanceInWordsToNow(this.ann.timestamp)} ago`;
      this.fullDateString = fns.format(this.ann.timestamp, 'MMM D, YYYY, h:mm a');
    }

    this.colorString = `color${AnnotationComponent.getColorIndex(this.ann.author)}`;
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
      this.setStrings();
      this.change.emit();
    }
  }

  removeMe() {
    this.ann.text = '';
    this.ann.timestamp = 0;
    this.change.emit();
  }
}
