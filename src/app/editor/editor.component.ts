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

  _file: GitHubFile = null;
  @Input() set file(v: GitHubFile) {
    if (v !== this._file) {
      this._file = v;
      if (this._file !== null) {
        this.instance.setValue(this._file.contents);
      }
    }
  }
  get file(): GitHubFile { return this._file; }

  @Input() config: object;
  @Output() change = new EventEmitter();
  @Output() focus = new EventEmitter();
  @Output() blur = new EventEmitter();
  @Output() cursorActivity = new EventEmitter();

  @ViewChild('host') host: ElementRef;

  @Output() instance: CodeMirror.Editor = null;

  constructor() { }

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
    this.instance.setValue(this.host.nativeElement.innerText);

    this.instance.on('change', () => {
      this._file.contents = this.instance.getValue();
    });
  }

}
