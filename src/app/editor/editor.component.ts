import { Component,
         AfterViewInit,
         OnDestroy,
         Input,
         Output,
         ViewChild,
         ElementRef,
         EventEmitter,
       } from '@angular/core';

import * as CodeMirror from 'codemirror';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/edit/continuelist';

import { GitHubFile, GitHubRepo, GitHubAccessComponent } from '../githubaccess/githubaccess.component';

export enum EditorMode {
  Edit = 'edit',
  Locked = 'locked'
}

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements AfterViewInit, OnDestroy {

  @ViewChild('host') host: ElementRef;
  instance: CodeMirror.Editor = null;

  @Output() change = new EventEmitter();
  @Output() cursorActivity = new EventEmitter();

  @Input() ghAccess: GitHubAccessComponent;

  mode: EditorMode;
  checkInterval: number = null;

  _file: GitHubFile = null;
  @Input() set file(v: GitHubFile) {
    if (v !== this._file) {
      this.fileOutOfSync = false;
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;

      this._file = v;
      if (this._file !== null && this.instance !== null) {
        const newDoc = CodeMirror.Doc(this._file.contents, 'markdown');
        this.instance.swapDoc(newDoc);
        this.instance.refresh();
        // TODO: figure out if we can be more precise and do this
        //       to just a single element instead of the whole window
        window.scrollTo(0, 0);
      }

      if (this._file !== null) {
        this.checkInterval = window.setInterval(() => this.checkAgainstServer(), 60 * 1000);
      }
    }
  }
  get file(): GitHubFile { return this._file; }
  fileOutOfSync: boolean;

  changeGeneration = 0;


  constructor() {
    this.mode = EditorMode.Edit;
  }

  ngAfterViewInit() {
    const config  = {
      mode: {
        name: 'markdown',
        strikethrough: true
      },
      theme: 'drax',
      indentUnit: 4,
      smartIndent: false,
      indentWithTabs: true,
      electricChars: false,
      lineWrapping: true,
      autofocus: true,
      extraKeys: {
        Enter: 'newlineAndIndentContinueMarkdownList'
      }
    };

    if (this._file !== null) {
      this.host.nativeElement.value = this._file.contents;
    }

    this.instance = CodeMirror.fromTextArea(this.host.nativeElement, config);
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

      this.change.emit();
    });
  }

  ngOnDestroy() {
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
    }
  }

  takeFocus() {
    this.instance.focus();
  }

  setMode(newMode: EditorMode) {
    this.mode = newMode;
    if (this.mode === EditorMode.Locked) {
      this.instance.setOption('readOnly', 'nocursor');
    }
    else {
      this.instance.setOption('readOnly', false);
    }
  }

  prepForSave(): boolean {
    this.setMode(EditorMode.Locked);
    return true;
  }

  cancelSave(): boolean {
    this.setMode(EditorMode.Edit);
    return true;
  }

  save(commitMessage: string): Promise<boolean> {
    // TODO: set the toolbar icon spinning or something until this is done
    return this.ghAccess.pushFile(this._file, commitMessage).then(val => {
      if (val['success']) {
        this.changeGeneration = this.instance.getDoc().changeGeneration();
        this.change.emit();
        return true;
      }
      else {
        console.error(val['message']);
        console.error(val['error']);
        return false;
      }
    });
  }

  checkAgainstServer() {
    if (this._file === null) {
      return;
    }
    this.ghAccess.getPathInfo(this._file.item).then(response => {
      if (response === null || response['object'] === null) {
        console.error('File no longer exists.');
        return;
      }
      if (this._file.item.lastGet === response['object']['oid']) {
        // console.log('All good!');
      }
      else {
        // console.log('File has changed...');
        this.fileOutOfSync = true;
        this.change.emit();
      }
    });
  }

  refreshContents(): boolean {
    this.ghAccess.getFileContents(this._file.item).then(newFile => {
      this.file = newFile;
    });
    return true;
  }

  /***** Text Formatting ******/

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

      if (startTok.type === null || startTok.type.split(' ').indexOf('header') < 0) {
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

  toggleCode() {
    this.toggleWrappedFormatting(['`'], 'comment');
    return true;
  }

  toggleStrikethrough() {
    this.toggleWrappedFormatting(['~~'], 'strikethrough');
    return true;
  }

  toggleBlockQuote() {
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

    if (tokens.length === 0) {
      this.instance.operation(() => {
        doc.replaceRange(
            `${formatting[0]}${formatting[0]}`,
            workingRange.from(),
            workingRange.to(),
            'wrappedFormatting'
        );
        workingRange.anchor.ch += formatting[0].length;
        workingRange.head.ch += formatting[0].length;
        doc.setSelection(
          workingRange.anchor,
          workingRange.head,
          {origin: 'wrappedFormatting'}
        );
      });
      return;
    }

    let turningOn = true;
    if (tokens.length === 1) {
      if (tokens[0][1].string === `${formatting[0]}${formatting[0]}`) {
        const line = workingRange.from().line;
        doc.replaceRange(
            '',
            CodeMirror.Pos(tokens[0][0], tokens[0][1].start),
            CodeMirror.Pos(tokens[0][0], tokens[0][1].end),
            'wrappedFormatting'
        );
        return;
      }

      if (tokens[0][1].type && tokens[0][1].type.split(' ').indexOf(symbolType) >= 0) {
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
        if (tok[1].type && tok[1].type.split(' ').indexOf(symbolType) >= 0) {
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
          const lastTok = tokens[tokens.length - 1][1];
          turningOn = lastTok.type && lastTok.type.split(' ').indexOf(symbolType) >= 0;
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
      for (const tok of tokens.slice().reverse()) {
        if (formatting.indexOf(tok[1].string) >= 0) {
          doc.replaceRange('',
                           CodeMirror.Pos(tok[0], tok[1].start),
                           CodeMirror.Pos(tok[0], tok[1].end),
                           'wrappedFormatting'
                          );
        }
      }

      workingRange = this.getWorkingRange();
      doc.setSelection(workingRange.from(), workingRange.to(), { origin: 'wrappedFormatting' });
      if (turningOn) {
        doc.replaceRange(formatting[0], workingRange.to(), workingRange.to(), 'wrappedFormatting');
        doc.replaceRange(formatting[0], workingRange.from(), workingRange.from(), 'wrappedFormatting');

        let currLine = tokens[0][0];
        const paragraphStarts: [number, CodeMirror.Token][] = [];
        const paragraphEnds:   [number, CodeMirror.Token][] = [];
        for (let i = 0; i < tokens.length; i++) {
          const tok = tokens[i];
          if (tok[0] === currLine) {
            continue;
          }
          if ((tok[0] - currLine) > 1) {
            paragraphStarts.push(tok);
            paragraphEnds.push(tokens[i - 1]); // safe; we know this isn't 0
          }

          currLine = tok[0];
        }

        const from = workingRange.from();
        from.ch += formatting[0].length;
        const to = workingRange.to();

        const paraStartLines: number[] = [];
        for (const tok of paragraphStarts) {
          doc.replaceRange(
            formatting[0],
            CodeMirror.Pos(tok[0], tok[1].start),
            CodeMirror.Pos(tok[0], tok[1].start),
            'wrappedFormatting'
          );
          if (to.line === tok[0]) {
            to.ch += formatting[0].length;
          }
          paraStartLines.push(tok[0]);
        }
        for (const tok of paragraphEnds) {
          let endIndex = tok[1].end;
          if (tok[0] === from.line || paraStartLines.indexOf(tok[0]) >= 0) {
            endIndex += formatting[0].length;
          }
          doc.replaceRange(
            formatting[0],
            CodeMirror.Pos(tok[0], endIndex),
            CodeMirror.Pos(tok[0], endIndex),
            'wrappedFormatting'
          );
          if (to.line === tok[0]) {
            to.ch += formatting[0].length;
          }
        }

        if (workingRange.to().line === workingRange.from().line) {
          to.ch += formatting[0].length;
        }
        doc.setSelection(workingRange.from(), workingRange.to(), { origin: 'wrappedFormatting' });
      }
      else {
        const startTok = tokens[0];
        const endTok = tokens[tokens.length - 1];

        if (   (startTok[1].string.trim().length === 0)
            && (  endTok[1].string.trim().length === 0) ) {
              // this is in the middle of a big formatted stretch
              const from = CodeMirror.Pos(startTok[0], startTok[1].start);
              const   to = CodeMirror.Pos(  endTok[0],   endTok[1].end);

              doc.replaceRange(formatting[0], to, to, 'wrappedFormatting');
              doc.replaceRange(formatting[0], from, from, 'wrappedFormatting');
        }
      }
    });
  }
}
