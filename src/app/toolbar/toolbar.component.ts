import { Component, OnInit, AfterViewInit, Input } from '@angular/core';

import { ToolbarItem, Button, ButtonState, Separator } from './toolbar-items';
import { EditorComponent, EditorMode } from '../editor/editor.component';


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit, AfterViewInit {

  items: ToolbarItem[] = [];

  @Input('editor') editor: EditorComponent;

  commitMessage = '';

  constructor() { }

  ngOnInit() {
    this.items.push(
      new Button('Save', 'Sync your changes back to GitHub', 'floppy-o',
                  (execute) => this.editor.prepForSave(execute)),
      new Button('Refresh', 'Refresh file from GitHub', 'refresh',
                  (execute) => this.editor.refreshContents(execute)),
      new Button('History', 'View history of file changes', 'history',
                  (execute) => this.editor.showHistory(execute)),
      new Separator(),
      new Button('Bold', 'Change text to bold', 'bold',
                  (execute) => this.editor.toggleBold(execute)),
      new Button('Italics', 'Change text to italics', 'italic',
                  (execute) => this.editor.toggleItalics(execute)),
      new Button('Header', 'Cycle through header levels', 'header',
                  (execute) => this.editor.cycleHeaderLevel(execute)),
      new Separator(),
      new Button('Link', 'Add website link', 'link',
                  (execute) => this.editor.createLink(execute)),
      new Button('Bulleted List', 'Create a bulleted list', 'list-ul',
                  (execute) => this.editor.toggleBulletList(execute)),
      // new Button('Numbered List', 'Create a numbered list', 'list-ol',
      //             () => true),
      new Separator(),
      new Button('Code', 'Change text to monospaced', 'code',
                  (execute) => this.editor.toggleCode(execute)),
      new Button('Strikethrough', 'Cross out text', 'strikethrough',
                  (execute) => this.editor.toggleStrikethrough(execute)),
      new Button('Blockquote', 'Create a blockquote', 'quote-left',
                  (execute) => this.editor.toggleBlockQuote(execute)),
      new Separator(),
      new Button('Add Comment', 'Add a comment at the selected point in the file', 'comment',
                  (execute) => this.editor.createNewAnnotationCommand(execute)),
      new Button('Toggle Comments', 'Show comments that have been made on this file', 'comments',
                  (execute) => this.editor.toggleAnnotationGutter(execute)),
    );

    // set the button states the first time
    this.handleEditorChange();
  }

  ngAfterViewInit() {
    this.editor.change.subscribe(() => this.handleEditorChange());
    this.editor.cursorActivity.subscribe(() => this.handleEditorChange(true));
  }

  handleClick(button: Button) {
    if (button.state === ButtonState.Disabled) {
      return;
    }
    button.state = button.callback(true);
    this.editor.takeFocus();
  }

  handleEditorChange(isCursorChange: boolean = false) {
    const nonMarkdown = [
      'Save', 'Refresh', 'History', 'Add Comment', 'Toggle Comments'
    ];

    for (const item of this.items) {
      if (!(item instanceof Button)) {
        continue;
      }
      const button = item as Button;

      const isMDbutton = nonMarkdown.indexOf(button.name) < 0;
      if (isCursorChange && !isMDbutton) {
        continue;
      }

      if (isMDbutton && this.editor.markdownConfig.name.length === 0) {
        button.state = ButtonState.Disabled;
        continue;
      }

      if (this.editor.mode === EditorMode.Locked) {
        button.state = ButtonState.Disabled;
        continue;
      }

      const res: ButtonState = button.callback(false);
      if (res === ButtonState.Active) {
        button.state = ButtonState.Inactive;
      }
      else if (res === ButtonState.Inactive) {
        button.state = ButtonState.Active;
      }
      else if (res === null) {
        button.state = ButtonState.Disabled;
      }
    }
  }
}
