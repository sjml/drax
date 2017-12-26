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


  @ViewChild('host') host: ElementRef;
  @Output() instance: CodeMirror.Editor = null;


  constructor() { }

  ngAfterViewInit() {
    const config  = {
      mode: 'markdown',
      theme: 'drax',
      indentUnit: 4,
      smartIndent: false,
      indentWithTabs: true,
      electricChars: false,
      lineWrapping: true,
      autofocus: true,
    };
    this.instance = CodeMirror.fromTextArea(this.host.nativeElement, config);
    this.instance.setValue(this.host.nativeElement.innerText);

    this.instance.on('change', () => {
      this._file.contents = this.instance.getValue();
    });
  }

}
