import { Component,
         OnInit,
         AfterViewInit,
         OnDestroy,
         Input,
         Output,
         ViewChild,
         ElementRef,
         EventEmitter,
         HostListener
       } from '@angular/core';
import { ActivatedRoute, UrlSegment } from '@angular/router';

import * as JSDiff from 'diff';

import * as CodeMirror from 'codemirror';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/edit/continuelist';

import 'codemirror/mode/yaml/yaml';
import 'codemirror/mode/yaml-frontmatter/yaml-frontmatter';
import 'codemirror/mode/toml/toml';
import '../../js-util/toml-frontmatter';

import { ConfigService } from '../config.service';
import { GitHubService } from '../githubservice/github.service';
import { ModalService } from '../drax-modal/modal.service';
import { DataRequestModalComponent } from '../drax-modal/data-request-modal.component';
import { FileHistoryModalComponent } from './file-history-modal.component';

import { GitHubFile, GitHubItem, GitHubRepo } from '../githubservice/githubclasses';
import { ButtonState } from '../toolbar/toolbar-items';
import { Annotation, AnnotationSort } from '../annotation/annotation';
import { AnnotationComponent } from '../annotation/annotation.component';
import { AnnotationContainerComponent } from '../annotation-container/annotation-container.component';

export enum EditorMode {
  Edit = 'edit',
  Locked = 'locked'
}


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('host') host: ElementRef;
  @Output() change = new EventEmitter();
  @Output() cursorActivity = new EventEmitter();

  @ViewChild(AnnotationContainerComponent) annContComp: AnnotationContainerComponent;

  instance: CodeMirror.Editor = null;
  mode: EditorMode;
  checkInterval: number = null;
  changeGeneration = 0;

  annotations: Annotation[] = [];
  deadMarkers: CodeMirror.TextMarker[] = [];
  originalRawAnnotations: any[] = null;
  annotationsDirty = false;

  markdownConfig = {
    name: 'toml-frontmatter',
    base: 'markdown',
    strikethrough: true
  };

  _file: GitHubFile = null;
  set file(v: GitHubFile) {
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

  @HostListener('window:resize') onResize() {
    this.updateAnnotations();
  }

  constructor(
    private route: ActivatedRoute,
    private config: ConfigService,
    private modalService: ModalService,
    private gitHubService: GitHubService
  ) {
    this.mode = EditorMode.Edit;
  }

  ngOnInit() {
    const standardMapping = {
      'Ctrl-S': () => { this.prepForSave(true); },
      // 'Ctrl-R': () => { this.refreshContents(true); },
      'Ctrl-B': () => { this.toggleBold(true); },
      'Ctrl-I': () => { this.toggleItalics(true); },
      'Ctrl-H': () => { this.cycleHeaderLevel(true); },
      'Ctrl-K': () => { this.createLink(true); },
      'Ctrl-L': () => { this.toggleBulletList(true); },
      'Ctrl-\'': () => { this.toggleBlockQuote(true); },
    };
    const macMapping = {
      'Cmd-S': () => { this.prepForSave(true); },
      // 'Cmd-R': () => { this.refreshContents(true); },
      'Cmd-B': () => { this.toggleBold(true); },
      'Cmd-I': () => { this.toggleItalics(true); },
      'Cmd-H': () => { this.cycleHeaderLevel(true); },
      'Cmd-K': () => { this.createLink(true); },
      'Cmd-L': () => { this.toggleBulletList(true); },
      'Cmd-\'': () => { this.toggleBlockQuote(true); },
    };
    let extraKeys = null;
    if (/Mac/.test(window.navigator.platform)) {
      extraKeys = macMapping;
    }
    else {
      extraKeys = standardMapping;
    }
    extraKeys.Enter = 'newlineAndIndentContinueMarkdownList';

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
      extraKeys: extraKeys
    };

    // host isn't guaranteed to be non-null because this is in
    //  ngOnInit; however, doing it with ngAfterViewInit leads
    //  to values changing in bad times in the view
    //  This shouldn't work, but does, which makes me nervous...
    this.instance = CodeMirror.fromTextArea(this.host.nativeElement, config);
    this.route.url.subscribe(url => {
      this.loadFromUrl(url);
    });

    this.instance.on('changes', () => {
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

      this.updateAnnotations();
      this.change.emit();
    });

    this.instance.on('cursorActivity', () => {
      this.cursorActivity.emit();
    });
  }

  ngAfterViewInit() {
    this.annContComp.annotationChanges.subscribe(() => {
      const oldDirty = this.annotationsDirty;
      this.checkAnnotations();
      if (oldDirty !== this.annotationsDirty) {
        this.change.emit();
      }
    });
  }

  ngOnDestroy() {
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async loadFromUrl(urlSegs: UrlSegment[]) {
    if (urlSegs.length < 2) {
      return; // TODO: error
    }

    const repo = new GitHubRepo();
    repo.owner = urlSegs[0].path;
    const splits = urlSegs[1].path.split(':');
    repo.name = splits[0];

    const singleRepoData = this.config.getConfig('singleRepo');
    if (singleRepoData !== null) {
      if (
             repo.owner !== singleRepoData['owner']
          || repo.name  !== singleRepoData['name']
         ) {
        // TODO: crap out or redirect?
      }
    }

    const item = new GitHubItem();
    item.repo = repo;
    if (splits.length > 1) {
      item.branch = splits[1];
    }
    if (urlSegs.length > 2) {
      item.fileName = urlSegs.pop().path;
      item.dirPath = urlSegs.slice(2).join('/');
    }

    // TODO: do this with only one remote call
    const itemLoaded = await this.gitHubService.loadItemData(item);
    if (!itemLoaded) {
      return; // TODO: error
    }
    this.file = await this.gitHubService.getFile(item);
  }

  private processFileContents() {
    const mdFileTypes = [
      'markdown', 'mdown', 'mkdn', 'md', 'mkd', 'mdwn',
      'mdtxt', 'mdtext', 'text', 'txt', 'Rmd'
    ];

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

    const newDoc = CodeMirror.Doc(this._file.contents, this.markdownConfig);
    this.instance.swapDoc(newDoc);
    this.changeGeneration = this.instance.getDoc().changeGeneration();

    this.instance.refresh();
    this.takeFocus();
  }

  private async processAnnotations() {
    const finalize = (anns: Annotation[] = null) => {
      if (anns !== null) {
        this.annotations = anns;
      }
      this.updateAnnotations();
      this.change.emit();
    };

    this.annotations = [];
    this.originalRawAnnotations = null;
    this.annotationsDirty = false;
    this.annContComp.clearLines();
    if (!this._file.item.repo.config['hasConfig']) {
      return finalize();
    }

    // check for accompanying annotation file
    const item = new GitHubItem();
    item.repo = this._file.item.repo;
    item.branch = this._file.item.branch;
    item.dirPath = `.drax/annotations${this._file.item.dirPath}`;
    item.fileName = `${this._file.item.fileName}.json`;
    const fileResponse = await this.gitHubService.getFile(item);
    if (fileResponse === null) {
      return finalize();
    }

    const annData = JSON.parse(fileResponse.contents);
    const newAnns: Annotation[] = [];
    if (annData.annotations) {
      this.originalRawAnnotations = annData.annotations;
      for (const ann of annData.annotations) {
        const newAnn = new Annotation();
        newAnn.from = CodeMirror.Pos(ann.from.line, ann.from.ch);
        newAnn.to = CodeMirror.Pos(ann.to.line, ann.to.ch);
        newAnn.author = ann.author;
        newAnn.timestamp = ann.timestamp;
        newAnn.text = ann.text;
        newAnns.push(newAnn);
      }
    }

    if (annData.parentOid !== this._file.item.lastGet) {
      // TODO: grace
      const oldFileContents = await this.gitHubService.getFileContentsFromOid(this._file.item.repo, annData.parentOid);
      if (oldFileContents !== null) {
        const diffs = JSDiff.diffChars(oldFileContents, this._file.contents);
        const doc = this.instance.getDoc();
        this.instance.operation(() => {
          doc.setValue(oldFileContents);
          this.initialMarkText(newAnns);

          let lineIndex = 0;
          let chIndex = 0;
          for (const change of diffs) {
            if (change.added === undefined && change.removed === undefined) {
              for (const c of change.value) {
                if (c === '\n') {
                  lineIndex += 1;
                  chIndex = 0;
                }
                else {
                  chIndex += 1;
                }
              }
            }
            else if (change.removed === true) {
              const from = { line: lineIndex, ch: chIndex };
              const to = { line: lineIndex, ch: chIndex };
              for (const c of change.value) {
                if (c === '\n') {
                  to.line += 1;
                  to.ch = 0;
                }
                else {
                  to.ch += 1;
                }
              }
              doc.replaceRange('', from, to);
            }
            else if (change.added === true) {
              const from = { line: lineIndex, ch: chIndex };
              doc.replaceRange(change.value, from);
              for (const c of change.value) {
                if (c === '\n') {
                  lineIndex += 1;
                  chIndex = 0;
                }
                else {
                  chIndex += 1;
                }
              }
            }
          }

          doc.clearHistory();
          doc.markClean();
        });
      }
      else {
        this.initialMarkText(newAnns);
      }
    }
    else {
      this.initialMarkText(newAnns);
    }

    return finalize(newAnns);
  }

  loadFreshFile() {
    if (this._file) {
      this.processFileContents();
      this.processAnnotations();
    }

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
    if (!this._file || !(this._file.isDirty || this.annotationsDirty)) {
      return null;
    }
    if (execute) {
      this.modalService.generate(
        DataRequestModalComponent,
        {
          display: {
            title: 'Save File',
            description: 'Save a new version of this file to GitHub. All past versions are kept, so your work is never lost.',
            fields: [
              {
                name: 'commitMessage',
                value: '',
                required: true,
                placeholder: 'Write a short note to describe your changes.',
                showAsTextArea: true
              }
            ]
          },
          callback: (pressedOK, values) => {
            if (!pressedOK) {
              this.cancelSave();
              return;
            }
            this.save(values['commitMessage']);
          }
        }
      );
      return ButtonState.Inactive;
    }
    return ButtonState.Active;
  }

  cancelSave(): boolean {
    return true;
  }

  save(commitMessage: string): Promise<boolean> {
    return this.pushMainFile(commitMessage)
                  .then((mainPushRes) => {
                    return this.pushAnnotationsFile(commitMessage)
                      .then((annPushRes) => {
                        this.change.emit();
                        return true;
                      })
                      .catch((err) => {
                        console.error(err);
                        return false;
                      });
                  })
                  .catch((err) => {
                    console.error(err);
                    return false;
                  });
  }

  pushMainFile(commitMessage: string): Promise<boolean> {
    if (!this._file.isDirty) {
      return Promise.resolve(true);
    }
    else {
      return this.gitHubService.pushFile(this._file, commitMessage).then(val => {
        if (val['success']) {
          this.changeGeneration = this.instance.getDoc().changeGeneration();
          return Promise.resolve(true);
        }
        else {
          console.error(val['message']);
          return Promise.reject(val['message']);
        }
      });
    }
  }

  pushAnnotationsFile(commitMessage: string): Promise<boolean> {
    if (!this.annotationsDirty) {
      return Promise.resolve(true);
    }
    else {
      const annFileObj = {};
      annFileObj['parentOid'] = this._file.item.lastGet;
      annFileObj['annotations'] = [];
      for (const ann of this.annotations) {
        if (ann.removed) {
          continue;
        }
        const annObj = {};
        annObj['from'] = { line: ann.from.line, ch: ann.from.ch };
        annObj['to'] = { line: ann.to.line, ch: ann.to.ch };
        annObj['author'] = ann.author;
        annObj['timestamp'] = ann.timestamp;
        annObj['text'] = ann.text;
        annFileObj['annotations'].push(annObj);
      }
      const outputString = JSON.stringify(annFileObj, null, 2);

      const item = new GitHubItem();
      item.repo = this._file.item.repo;
      item.branch = this._file.item.branch;
      item.dirPath = `.drax/annotations${this._file.item.dirPath}`;
      item.fileName = `${this._file.item.fileName}.json`;

      return this.gitHubService.getFile(item).then(fileResponse => {
        let fPush: GitHubFile = null;
        if (fileResponse !== null) {
          fPush = fileResponse;
          fPush.contents = outputString;
        }
        else {
          fPush = new GitHubFile(outputString);
          fPush.item = item;
        }
        return this.gitHubService.pushFile(fPush, commitMessage, fileResponse === null).then(val => {
          if (val['success']) {
            this.originalRawAnnotations = annFileObj['annotations'];
            this.annotationsDirty = false;
            return Promise.resolve(true);
          }
          else {
            console.error(val['message']);
            return Promise.reject(val['message']);
          }
        });
      });
    }
  }

  // runs periodically
  checkAgainstServer() {
    if (this._file === null) {
      return;
    }
    this.gitHubService.getPathInfo(this._file.item).then(response => {
      if (response === null || response['object'] === null) {
        console.error('File no longer exists.');
        return;
      }
      if (this._file.item.lastGet !== response['object']['oid']) {
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
      this.gitHubService.getFile(this._file.item).then(newFile => {
        this.file = newFile;
      });
    }
    return ButtonState.Active;
  }

  showHistory(execute: boolean): ButtonState {
    if (!this._file || this._file.item.lastGet === null) {
      return null;
    }
    if (execute) {
      // show history
      this.modalService.generate(
        FileHistoryModalComponent,
        {
          item: this._file.item,
          callback: (oid: string) => {
            this.loadOldVersion(oid);
          }
        }
      );
      return ButtonState.Inactive;
    }
    return ButtonState.Active;
  }

  loadOldVersion(oid: string) {
    this.gitHubService.getFileContentsFromCommit(this._file.item, oid).then((contents) => {
      if (contents !== null) {
        this.instance.setValue(contents);
        this.annotations = [];
        this.instance.refresh();
      }
    });
  }

  toggleAnnotationGutter(execute: boolean): ButtonState {
    if (this.annotations.length === 0) {
      return null;
    }
    if (this.annContComp.visible) {
      if (execute) {
        this.annContComp.visible = false;
        setTimeout(() => {
          this.instance.refresh();
        });
      }
      return ButtonState.Inactive;
    }
    else {
      if (execute) {
        this.annContComp.visible = true;
        setTimeout(() => {
          this.updateAnnotations();
          this.instance.refresh();
        });
      }
      return ButtonState.Active;
    }
  }

  createNewAnnotation() {
    const a = new Annotation();
    a.author = this.gitHubService.user.login;
    a.text = '';
    a.timestamp = 0;

    const selectedRange = this.getWorkingRange();
    a.from = selectedRange.from();
    a.to = selectedRange.to();

    const doc = this.instance.getDoc();
    a.marker = doc.markText(a.from, a.to, {
      className: `annotation color${AnnotationComponent.getColorIndex(a.author)}`,
      startStyle: 'annotationStart',
      endStyle: 'annotationEnd',
      inclusiveLeft: a.from.ch > 0,
      inclusiveRight: a.to.ch < doc.getLine(a.to.line).length
    });
    a.extents = this.instance.cursorCoords(a.from);

    this.annotations.push(a);
    this.annotations.sort(AnnotationSort);
    this.updateAnnotations();
  }

  createNewAnnotationCommand(execute: boolean): ButtonState {
    if (execute) {
      if (!this.annContComp.visible) {
        this.annContComp.visible = true;
        setTimeout(() => {
          this.updateAnnotations();
          this.createNewAnnotation();
        });
      }
      else {
        this.createNewAnnotation();
      }

      return ButtonState.Inactive;
    }
    return ButtonState.Active;
  }

  private initialMarkText(anns: Annotation[]) {
    // creating the CM markers initially
    const doc = this.instance.getDoc();
    for (const ann of anns) {
      if (ann.marker === null) {
        ann.marker = doc.markText(ann.from, ann.to, {
          className: `annotation color${AnnotationComponent.getColorIndex(ann.author)}`,
          startStyle: 'annotationStart',
          endStyle: 'annotationEnd',
          inclusiveLeft: ann.from.ch > 0,
          inclusiveRight: ann.to.ch < doc.getLine(ann.to.line).length
        });
      }
    }
  }

  updateAnnotations() {
    const doc = this.instance.getDoc();

    let revived = false;
    for (const marker of this.deadMarkers) {
      const currentRange = marker.find() as any;
      if (currentRange !== undefined) {
        const a: Annotation = marker['annotationData'];
        a.removed = false;
        this.annotations.push(a);
        revived = true;
      }
    }
    if (revived) {
      this.annotations.sort(AnnotationSort);
      this.deadMarkers = this.deadMarkers.filter((m) => m.find() === undefined);
    }

    for (const ann of this.annotations) {
      // updating our annotations as the CM markers move around
      const currentRange = ann.marker.find() as any;
      if (currentRange === undefined) {
        ann.removed = true;
        ann.marker['annotationData'] = ann;
        this.deadMarkers.push(ann.marker);
      }
      else {
        ann.from = currentRange.from;
        ann.to = currentRange.to;
      }
      ann.extents = this.instance.cursorCoords(ann.from);
    }

    this.annotations = this.annotations.filter((a) => !a.removed);

    if (this.annContComp !== null) {
      setTimeout(() => {
        this.annContComp.calculatePositions();
      });
    }
  }

  checkAnnotations() {
    if (this.originalRawAnnotations === null) {
      if (this.annotations.length === 0) {
        this.annotationsDirty = false;
        return;
      }
      else {
        this.annotationsDirty = true;
        return;
      }
    }
    if (this.annotations.length !== this.originalRawAnnotations.length) {
      this.annotationsDirty = true;
      return;
    }

    for (let i = 0; i < this.annotations.length; i++) {
      const ann = this.annotations[i];
      const raw = this.originalRawAnnotations[i];
      if (ann.author !== raw.author) {
        this.annotationsDirty = true;
        return;
      }
      if (ann.timestamp !== raw.timestamp) {
        this.annotationsDirty = true;
        return;
      }
      if (ann.text !== raw.text) {
        this.annotationsDirty = true;
        return;
      }
      if (ann.from.line !== raw.from.line) {
        this.annotationsDirty = true;
        return;
      }
      if (ann.from.ch !== raw.from.ch) {
        this.annotationsDirty = true;
        return;
      }
      if (ann.to.line !== raw.to.line) {
        this.annotationsDirty = true;
        return;
      }
      if (ann.to.ch !== raw.to.ch) {
        this.annotationsDirty = true;
        return;
      }
    }
    this.annotationsDirty = false;
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

  private getMarkdownStateFromToken(tok: CodeMirror.Token) {
    let state = tok.state;
    if (state.inner !== undefined && state.inner !== null) {
      if (state.state < 2) {
        return null;
      }
      else {
        state = state.inner;
      }
    }
    return state;
  }

  cycleHeaderLevel(execute: boolean): ButtonState {
    const range = this.getWorkingRange();
    const doc = this.instance.getDoc();

    for (let lineIndex = range.from().line; lineIndex <= range.to().line; lineIndex++) {
      const startTok = this.instance.getLineTokens(lineIndex, true)[0];

      let state = null;
      if (startTok) {
        state = this.getMarkdownStateFromToken(startTok);
        if (state === null) {
          return null;
        }
      }

      if (! startTok || state.header === 0) {
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

      const state = this.getMarkdownStateFromToken(startTok);
      if (state === null) {
        return null;
      }
      if (state.quote !== 0) {
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

      const state = this.getMarkdownStateFromToken(startTok);
      if (state === null) {
        return null;
      }

      if (state.list && bullets.indexOf(startTok.string) >= 0) {
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
            const state = this.getMarkdownStateFromToken(startTok);
            if (state.list) {
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
            const state = this.getMarkdownStateFromToken(startTok);
            if (!state.list) {
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
      const state = this.getMarkdownStateFromToken(tok[1]);
      if (state === null) {
        return null;
      }
      if (state.linkText || state.linkTitle || state.linkHref) {
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

        // leaving subtraction of zero to remind myself that
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

    // check to make sure we're not in the frontmatter
    for (const tok of tokens) {
      const state = this.getMarkdownStateFromToken(tok[1]);
      if (state === null) {
        return null;
      }
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

      const state = this.getMarkdownStateFromToken(tokens[0][1]);
      if (state[symbolType]) {
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
        const state = this.getMarkdownStateFromToken(tok[1]);
        if (state[symbolType]) {
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
          const lastState = this.getMarkdownStateFromToken(lastTok);
          turningOn = lastState[symbolType];
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
