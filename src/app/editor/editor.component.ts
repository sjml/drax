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
import { worker } from 'cluster';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements AfterViewInit {

  @ViewChild('host') host: ElementRef;
  instance: CodeMirror.Editor = null;


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

  changeGeneration = 0;


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
    this.changeGeneration = this.instance.getDoc().changeGeneration();

    this.instance.on('change', () => {
      if (!this._file) {
        return; // TODO: no file set; make this smarter
      }
      this._file.contents = this.instance.getValue();

      if (
        (!this.instance.getDoc().isClean(this.changeGeneration))
        && (this._file.contents !== this._file.pristine)
        ) {
        this._file.isDirty = true;
      }
      else {
        this._file.isDirty = false;
      }
    });
  }


  getWorkingRange(): CodeMirror.Range {
    const doc = this.instance.getDoc();

    const workingRange: CodeMirror.Range = this.instance.findWordAt(doc.getCursor());
    if (doc.somethingSelected()) {
      workingRange.anchor = doc.getCursor('anchor');
      workingRange.head = doc.getCursor('head');
    }

    return workingRange;
  }

  toggleBold() {
    const doc = this.instance.getDoc();

    let workingRange = this.getWorkingRange();

    const tokens: [number, CodeMirror.Token][] = [];

    if (workingRange.from().line === workingRange.to().line) {
      const lineTokens = this.instance.getLineTokens(workingRange.from().line, true);
      for (const tok of lineTokens) {
        let pushMe = false;
        if (tok.start < workingRange.from().ch) {
          if (tok.end >= workingRange.from().ch) {
            pushMe = true;
          }
        }
        else if (tok.end > workingRange.to().ch) {
          if (tok.start <= workingRange.to().ch) {
            pushMe = true;
          }
        }
        else {
          pushMe = true;
        }
        if (pushMe) {
          tokens.push([workingRange.from().line, tok]);
        }
      }
    }
    else {
      doc.eachLine(workingRange.from().line, workingRange.to().line + 1, lineHandle => {
        const lineNumber = doc.getLineNumber(lineHandle);
        const lineTokens = this.instance.getLineTokens(lineNumber, true);

        if (lineNumber === workingRange.from().line) {
          // first line
          for (const tok of lineTokens) {
            if (tok.end >= workingRange.from().ch) {
              tokens.push([lineNumber, tok]);
            }
          }
        }
        else if (lineNumber === workingRange.to().line) {
          // last line
          for (const tok of lineTokens) {
            if (tok.start <= workingRange.to().ch) {
              tokens.push([lineNumber, tok]);
            }
          }
        }
        else {
          // full line
          lineTokens.map(tok => {
            tokens.push([lineNumber, tok]);
          });
        }
      });
    }


    let turningBold = true;
    if (tokens.length === 1) {
      if (tokens[0][1].type === 'strong') {
        turningBold = false;
      }
    }
    else {
      // if selection swaps between bold and not bold:
      //   - if only two stretches, toggle to the last one
      //   - if more, make everything bold
      let boldStretchesCount = 0;
      let isBold = false;
      let hasPlain = false;
      for (const tok of tokens) {
        if (tok[1].type === 'strong') {
          if (!isBold) {
            boldStretchesCount += 1;
          }
          isBold = true;
        }
        else {
          isBold = false;
          hasPlain = true;
        }
      }
      if (boldStretchesCount === 1) {
        if (hasPlain) {
          turningBold = tokens[tokens.length - 1][1].type === 'strong';
        }
        else {
          turningBold = false;
        }
      }
      else {
        turningBold = true;
      }
    }

    this.instance.operation(() => {
      // clear out any interior markers
      for (const tok of tokens.reverse()) {
        if (tok[1].string === '**') {
          doc.replaceRange('',
                           CodeMirror.Pos(tok[0], tok[1].start),
                           CodeMirror.Pos(tok[0], tok[1].end),
                          );
        }
      }

      workingRange = this.getWorkingRange();
      doc.setSelection(workingRange.from(), workingRange.to());
      if (turningBold) {
        doc.replaceRange('**', workingRange.to());
        doc.replaceRange('**', workingRange.from());
        const from = workingRange.from();
        from.ch += 2;
        const to = workingRange.to();
        if (workingRange.to().line === workingRange.from().line) {
          to.ch += 2;
        }
        doc.setSelection(workingRange.from(), workingRange.to());
      }
    });
  }
}
