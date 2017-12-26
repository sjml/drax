import { Component,
         AfterViewInit,
         Input,
         Output,
         ViewChild,
         ElementRef,
         EventEmitter,
       } from '@angular/core';

import * as CodeMirror from 'codemirror';
import 'codemirror/mode/markdown/markdown';

import { GitHubFile, GitHubRepo } from '../githubaccess/githubaccess.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements AfterViewInit {

  @Input() file: GitHubFile;

  @Input() config: object;
  @Output() change = new EventEmitter();
  @Output() focus = new EventEmitter();
  @Output() blur = new EventEmitter();
  @Output() cursorActivity = new EventEmitter();

  @ViewChild('host') host: ElementRef;

  @Output() instance: CodeMirror.Editor = null;

  constructor() { }

  _value = '';
  get value() { return this._value; }
  @Input() set value(v) {
    if (v !== this._value) {
      this._value = v;
      this.onChange(v);
    }
  }

  updateValue(value) {
    this.value = value;
    this.onTouched();
    this.change.emit(value);
  }

  writeValue(value) {
    this._value = value || '';
    if (this.instance) {
      this.instance.setValue(this._value);
    }
  }

  onChange(_) {}
  onTouched() {}
  registerOnChange(fn) { this.onChange = fn; }
  registerOnTouched(fn) { this.onTouched = fn; }

  ngAfterViewInit() {
    this.config  = {
      mode: 'markdown',
      theme: 'drax',
      indentUnit: 4,
      smartIndent: false,
      indentWithTabs: true,
      electricChars: false,
      lineWrapping: true,
      autofocus: true,
    };
    this.instance = CodeMirror.fromTextArea(this.host.nativeElement, this.config);
    this.instance.setValue(this._value);
    this.instance.setValue(this.host.nativeElement.innerText);

    this.instance.on('change', () => {
      this.updateValue(this.instance.getValue());
    });

    this.instance.on('focus', (instance) => {
      this.focus.emit({instance});
    });

    this.instance.on('cursorActivity', (instance) => {
      this.cursorActivity.emit({instance});
    });

    this.instance.on('blur', (instance) => {
      this.blur.emit({instance});
    });
  }

}
