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

  takeFocus() {
    this.instance.focus();
  }

  private getWorkingRange(): CodeMirror.Range {
    const doc = this.instance.getDoc();

    const workingRange: CodeMirror.Range = this.instance.findWordAt(doc.getCursor());
    if (doc.somethingSelected()) {
      workingRange.anchor = doc.getCursor('anchor');
      workingRange.head = doc.getCursor('head');
    }

    return workingRange;
  }

  cycleHeaderLevel() {
    const range = this.getWorkingRange();
    const doc = this.instance.getDoc();

    for (let lineIndex = range.from().line; lineIndex <= range.to().line; lineIndex++) {
      const startTok = this.instance.getLineTokens(lineIndex, true)[0];

      if (startTok.type === null || startTok.type.indexOf('header') < 0) {
        // not a header; make it one
        doc.replaceRange('# ', CodeMirror.Pos(lineIndex, 0));
      }
      else if (startTok.string === '# ') {
        doc.replaceRange('## ', CodeMirror.Pos(lineIndex, startTok.start), CodeMirror.Pos(lineIndex, startTok.end));
      }
      else if (startTok.string === '## ') {
        doc.replaceRange('### ', CodeMirror.Pos(lineIndex, startTok.start), CodeMirror.Pos(lineIndex, startTok.end));
      }
      else if (startTok.string === '### ') {
        doc.replaceRange('#### ', CodeMirror.Pos(lineIndex, startTok.start), CodeMirror.Pos(lineIndex, startTok.end));
      }
      else if (startTok.string === '#### ') {
        doc.replaceRange('', CodeMirror.Pos(lineIndex, startTok.start), CodeMirror.Pos(lineIndex, startTok.end));
      }
    }

    return true;
  }

  toggleBold() {
    this.toggleWrappedFormatting(['**'], 'strong');
    return true;
  }

  toggleItalics() {
    this.toggleWrappedFormatting(['_', '*'], 'em');
    return true;
  }

  // there is almost certainly a more efficient way to do this
  toggleWrappedFormatting(formatting: string[], symbolType: string) {
    if (formatting.length === 0 || symbolType.length === 0) {
      // TODO: have this throw an error?
      return;
    }

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

    let turningOn = true;
    if (tokens.length === 1) {
      if (tokens[0][1].type === symbolType) {
        turningOn = false;
      }
    }
    else {
      // if selection swaps between formatted and not formatted:
      //   - if only two stretches, toggle to the last one
      //   - if more, make everything formatted
      let formattedStretchesCount = 0;
      let isFormatted = false;
      let hasPlain = false;
      for (const tok of tokens) {
        if (tok[1].type === symbolType) {
          if (!isFormatted) {
            formattedStretchesCount += 1;
          }
          isFormatted = true;
        }
        else {
          isFormatted = false;
          hasPlain = true;
        }
      }
      if (formattedStretchesCount === 1) {
        if (hasPlain) {
          turningOn = tokens[tokens.length - 1][1].type === symbolType;
        }
        else {
          turningOn = false;
        }
      }
      else {
        turningOn = true;
      }
    }

    this.instance.operation(() => {
      // clear out any interior markers
      for (const tok of tokens.reverse()) {
        if (formatting.indexOf(tok[1].string) >= 0) {
          doc.replaceRange('',
                           CodeMirror.Pos(tok[0], tok[1].start),
                           CodeMirror.Pos(tok[0], tok[1].end),
                          );
        }
      }

      workingRange = this.getWorkingRange();
      doc.setSelection(workingRange.from(), workingRange.to());
      if (turningOn) {
        doc.replaceRange(formatting[0], workingRange.to());
        doc.replaceRange(formatting[0], workingRange.from());
        const from = workingRange.from();
        from.ch += formatting[0].length;
        const to = workingRange.to();
        if (workingRange.to().line === workingRange.from().line) {
          to.ch += formatting[0].length;
        }
        doc.setSelection(workingRange.from(), workingRange.to());
      }
    });
  }
}
