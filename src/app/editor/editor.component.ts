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

import 'codemirror/mode/yaml/yaml';
import 'codemirror/mode/yaml-frontmatter/yaml-frontmatter';
import 'codemirror/mode/toml/toml';
import '../../js-util/toml-frontmatter';

import { ButtonState } from '../toolbar/toolbar-items';

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

  markdownConfig = {
    name: 'toml-frontmatter',
    base: 'markdown',
    strikethrough: true
  };

  _file: GitHubFile = null;
  @Input() set file(v: GitHubFile) {
    if (v !== this._file) {
      this.fileOutOfSync = false;
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;

      this._file = v;
      if (this._file !== null && this.instance !== null) {
        this.loadFreshFile();
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
      mode: this.markdownConfig,
      theme: 'drax',
      indentUnit: 4,
      smartIndent: false,
      indentWithTabs: true,
      electricChars: false,
      lineWrapping: true,
      autofocus: true,
      addModeClass: true,
      extraKeys: {
        Enter: 'newlineAndIndentContinueMarkdownList'
      }
    };

    this.instance = CodeMirror.fromTextArea(this.host.nativeElement, config);
    this.loadFreshFile();

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

    this.instance.on('cursorActivity', () => {
      this.cursorActivity.emit();
    });
  }

  ngOnDestroy() {
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
    }
  }

  loadFreshFile() {
    const mdFileTypes = [
      'markdown', 'mdown', 'mkdn', 'md', 'mkd', 'mdwn',
      'mdtxt', 'mdtext', 'text', 'txt', 'Rmd'
    ];

    const newDoc = CodeMirror.Doc(this._file.contents, this.markdownConfig);
    this.instance.swapDoc(newDoc);
    this.changeGeneration = this.instance.getDoc().changeGeneration();

    const pieces = this._file.item.fileName.split('.');
    const ext = pieces.pop();
    if (pieces.length > 0 && mdFileTypes.indexOf(ext) >= 0) {
      if (this._file.contents.startsWith('+++')) {
        this.markdownConfig.name = 'toml-frontmatter';
      }
      else if (this._file.contents.startsWith('---')) {
        this.markdownConfig.name = 'yaml-frontmatter';
      }
      else {
        this.markdownConfig.name = 'markdown';
      }
    }
    else {
      this.markdownConfig.name = '';
    }
    this.instance.setOption('mode', this.markdownConfig);

    this.instance.refresh();
    this.change.emit();
    this.takeFocus();

    // TODO: figure out if we can be more precise and do this
    //       to just a single element instead of the whole window
    window.scrollTo(0, 0);
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

  prepForSave(execute: boolean): ButtonState {
    console.log('save prep', this._file.isDirty);
    if (!this._file.isDirty) {
      return null;
    }
    if (execute) {
      this.setMode(EditorMode.Locked);
    }
    return ButtonState.Active;
  }

  cancelSave(): boolean {
    this.setMode(EditorMode.Edit);
    return true;
  }

  save(commitMessage: string): Promise<boolean> {
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

  // runs periodically
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

  refreshContents(execute: boolean): ButtonState {
    if (!this.fileOutOfSync) {
      return null;
    }
    if (execute) {
      this.ghAccess.getFileContents(this._file.item).then(newFile => {
        this.file = newFile;
      });
    }
    return ButtonState.Active;
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

  private getTokensInRange(range: CodeMirror.Range): [number, CodeMirror.Token][] {
    const tokens: [number, CodeMirror.Token][] = [];

    if (range.from().line === range.to().line) {
      const lineTokens = this.instance.getLineTokens(range.from().line, true);
      for (const tok of lineTokens) {
        let pushMe = false;
        if (tok.start < range.from().ch) {
          if (tok.end >= range.from().ch) {
            pushMe = true;
          }
        }
        else if (tok.end > range.to().ch) {
          if (tok.start <= range.to().ch) {
            pushMe = true;
          }
        }
        else {
          pushMe = true;
        }
        if (pushMe) {
          tokens.push([range.from().line, tok]);
        }
      }
    }
    else {
      this.instance.getDoc().eachLine(range.from().line, range.to().line + 1, lineHandle => {
        const lineNumber = this.instance.getDoc().getLineNumber(lineHandle);
        const lineTokens = this.instance.getLineTokens(lineNumber, true);

        if (lineNumber === range.from().line) {
          // first line
          for (const tok of lineTokens) {
            if (tok.end >= range.from().ch) {
              tokens.push([lineNumber, tok]);
            }
          }
        }
        else if (lineNumber === range.to().line) {
          // last line
          for (const tok of lineTokens) {
            if (tok.start <= range.to().ch) {
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

    return tokens;
  }

  cycleHeaderLevel(execute: boolean): ButtonState {
    const range = this.getWorkingRange();
    const doc = this.instance.getDoc();

    for (let lineIndex = range.from().line; lineIndex <= range.to().line; lineIndex++) {
      const startTok = this.instance.getLineTokens(lineIndex, true)[0];

      if (! startTok || startTok.state.header === 0) {
        // not a header; make it one
        if (execute) {
          doc.replaceRange('# ', CodeMirror.Pos(lineIndex, 0), CodeMirror.Pos(lineIndex, 0), 'headercycle');
        }
      }
      else if (startTok.string === '# ') {
        if (execute) {
          doc.replaceRange('## ', CodeMirror.Pos(lineIndex, startTok.start), CodeMirror.Pos(lineIndex, startTok.end), 'headercycle');
        }
      }
      else if (startTok.string === '## ') {
        if (execute) {
          doc.replaceRange('### ', CodeMirror.Pos(lineIndex, startTok.start), CodeMirror.Pos(lineIndex, startTok.end), 'headercycle');
        }
      }
      else if (startTok.string === '### ') {
        if (execute) {
          doc.replaceRange('#### ', CodeMirror.Pos(lineIndex, startTok.start), CodeMirror.Pos(lineIndex, startTok.end), 'headercycle');
        }
      }
      else if (startTok.string === '#### ') {
        // max header; clear it
        if (execute) {
          doc.replaceRange('', CodeMirror.Pos(lineIndex, startTok.start), CodeMirror.Pos(lineIndex, startTok.end), 'headercycle');
        }
      }
    }

    return ButtonState.Active;
  }

  toggleBlockQuote(execute: boolean = true): ButtonState {
    const range = this.getWorkingRange();
    const doc = this.instance.getDoc();

    let lineCount = 0;
    let quoteCount = 0;
    for (let lineIndex = range.from().line; lineIndex <= range.to().line; lineIndex++) {
      lineCount++;
      const startTok = this.instance.getLineTokens(lineIndex, true)[0];
      if (!startTok) {
        continue;
      }

      if (startTok.state.quote !== 0) {
        quoteCount++;
      }
    }

    if (lineCount === quoteCount) {
      // turning them off
      if (execute) {
        this.instance.operation(() => {
          for (let lineIndex = range.from().line; lineIndex <= range.to().line; lineIndex++) {
            const startTok = this.instance.getLineTokens(lineIndex, true)[0];
            if (!startTok) {
              continue;
            }
            doc.replaceRange('', CodeMirror.Pos(lineIndex, startTok.start), CodeMirror.Pos(lineIndex, startTok.end), 'bqCycle');
          }
        });
      }
      return ButtonState.Inactive;
    }
    else {
      if (execute) {
        this.instance.operation(() => {
          for (let lineIndex = range.from().line; lineIndex <= range.to().line; lineIndex++) {
            const startTok = this.instance.getLineTokens(lineIndex, true)[0];
            if (!startTok && lineCount > 1) {
              continue;
            }
            doc.replaceRange('> ', CodeMirror.Pos(lineIndex, 0), CodeMirror.Pos(lineIndex, 0), 'bqCycle');
          }
        });
      }
      return ButtonState.Active;
    }
  }

  toggleBulletList(execute: boolean = true): ButtonState {
    const bullets: string[] = ['* ', '+ ', '- '];
    const range = this.getWorkingRange();
    const doc = this.instance.getDoc();

    let lineCount = 0;
    let bulletedCount = 0;

    for (let lineIndex = range.from().line; lineIndex <= range.to().line; lineIndex++) {
      lineCount++;
      const startTok = this.instance.getLineTokens(lineIndex, true)[0];
      if (!startTok) {
        continue;
      }

      if (startTok.state.list && bullets.indexOf(startTok.string) >= 0) {
        bulletedCount++;
      }
    }

    if (lineCount === bulletedCount) {
      if (execute) {
        this.instance.operation(() => {
          for (let lineIndex = range.from().line; lineIndex <= range.to().line; lineIndex++) {
            const startTok = this.instance.getLineTokens(lineIndex, true)[0];
            if (!startTok) {
              continue;
            }
            if (startTok.state.list) {
              doc.replaceRange('', CodeMirror.Pos(lineIndex, startTok.start), CodeMirror.Pos(lineIndex, startTok.end), 'bulletToggle');
            }
          }
        });
      }
      return ButtonState.Inactive;
    }
    else {
      if (execute) {
        this.instance.operation(() => {
          for (let lineIndex = range.from().line; lineIndex <= range.to().line; lineIndex++) {
            const startTok = this.instance.getLineTokens(lineIndex, true)[0];
            if (!startTok) {
              continue;
            }
            if (!startTok.state.list) {
              doc.replaceRange('* ', CodeMirror.Pos(lineIndex, 0), CodeMirror.Pos(lineIndex, 0), 'bulletToggle');
            }
          }
        });
      }
      return ButtonState.Active;
    }
  }

  createLink(execute: boolean = true): ButtonState {
    const selection = this.getWorkingRange();
    const toks = this.getTokensInRange(selection);

    let hasLink = false;
    for (const tok of toks) {
      if (tok[1].state.linkText || tok[1].state.linkTitle || tok[1].state.linkHref) {
        hasLink = true;
      }
    }
    if (hasLink) {
      if (execute) {
        console.log('kill it');
      }
      return null;
    }

    if (execute) {
      this.instance.operation(() => {
        const closing = '](http://)';
        const doc = this.instance.getDoc();
        doc.replaceRange(closing, selection.to(), selection.to(), 'linkCreation');
        doc.replaceRange('[', selection.from(), selection.from(), 'linkCreation');

        // leaving subtraction by zero to remind myself that
        //   the offset from the back is intentional, to put the
        //   cursor right before the closing parenthesis
        selection.to().ch += closing.length - 0;
        doc.setCursor(selection.to());
      });
    }
    return ButtonState.Active;
  }

  toggleBold(execute: boolean = true): ButtonState {
    return this.toggleWrappedFormatting(['**'], 'strong', execute);
  }

  toggleItalics(execute: boolean = true): ButtonState {
    return this.toggleWrappedFormatting(['_', '*'], 'em', execute);
  }

  toggleCode(execute: boolean = true): ButtonState {
    return this.toggleWrappedFormatting(['`'], 'code', execute);
  }

  toggleStrikethrough(execute: boolean = true): ButtonState {
    return this.toggleWrappedFormatting(['~~'], 'strikethrough', execute);
  }

  // there is almost certainly a more efficient way to do this
  toggleWrappedFormatting(formatting: string[], symbolType: string, execute: boolean): ButtonState {
    if (formatting.length === 0 || symbolType.length === 0) {
      console.error('Tried to wrap formatting with no strings or symbol.');
      return;
    }

    const doc = this.instance.getDoc();

    let workingRange = this.getWorkingRange();
    const tokens = this.getTokensInRange(workingRange);

    if (tokens.length === 0) {
      if (execute) {
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
      }
      return ButtonState.Active;
    }

    let turningOn = true;
    if (tokens.length === 1) {
      if (tokens[0][1].string === `${formatting[0]}${formatting[0]}`) {
        if (execute) {
          const line = workingRange.from().line;
          doc.replaceRange(
              '',
              CodeMirror.Pos(tokens[0][0], tokens[0][1].start),
              CodeMirror.Pos(tokens[0][0], tokens[0][1].end),
              'wrappedFormatting'
          );
        }
        return ButtonState.Inactive;
      }

      if (tokens[0][1].state[symbolType]) {
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
        if (tok[1].state[symbolType]) {
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
          turningOn = lastTok.state[symbolType];
        }
        else {
          turningOn = false;
        }
      }
      else {
        turningOn = true;
      }
    }

    if (execute) {
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
    return turningOn ? ButtonState.Active : ButtonState.Inactive;
  }
}
