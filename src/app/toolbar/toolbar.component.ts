import { Component, OnInit, Input } from '@angular/core';

import { ToolbarItem, Button, ButtonState, Separator } from './toolbar-items';
import { EditorComponent, EditorMode } from '../editor/editor.component';


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  items: ToolbarItem[] = [];

  @Input('editor') editor: EditorComponent;

  commitMessage = '';

  constructor() { }

  ngOnInit() {
    this.editor.change.subscribe(() => this.handleEditorChange());
    this.editor.cursorActivity.subscribe(() => this.handleEditorChange());

    this.items.push(
      new Button('Save', 'Sync your changes back to GitHub', 'floppy-o',
                  ButtonState.Disabled, (execute) => this.editor.prepForSave(execute)),
      new Button('Refresh', 'Refresh file from GitHub', 'refresh',
                  ButtonState.Disabled, (execute) => this.editor.refreshContents(execute)),
      // new Button('History', 'View history of file changes', 'history',
      //             ButtonState.Disabled, () => true),
      new Separator(),
      new Button('Bold', 'Change text to bold', 'bold',
                  ButtonState.Inactive, (execute) => this.editor.toggleBold(execute)),
      new Button('Italics', 'Change text to italics', 'italic',
                  ButtonState.Inactive, (execute) => this.editor.toggleItalics(execute)),
      new Button('Header', 'Cycle through header levels', 'header',
                  ButtonState.Inactive, (execute) => this.editor.cycleHeaderLevel(execute)),
      new Separator(),
      new Button('Link', 'Add website link', 'link',
                  ButtonState.Inactive, (execute) => this.editor.createLink(execute)),
      new Button('Bulleted List', 'Create a bulleted list', 'list-ul',
                  ButtonState.Inactive, (execute) => this.editor.toggleBulletList(execute)),
      // new Button('Numbered List', 'Create a numbered list', 'list-ol',
      //             ButtonState.Disabled, () => true),
      new Separator(),
      new Button('Code', 'Change text to monospaced', 'code',
                  ButtonState.Inactive, (execute) => this.editor.toggleCode(execute)),
      new Button('Strikethrough', 'Cross out text', 'strikethrough',
                  ButtonState.Inactive, (execute) => this.editor.toggleStrikethrough(execute)),
      new Button('Blockquote', 'Create a blockquote', 'quote-left',
                  ButtonState.Inactive, (execute) => this.editor.toggleBlockQuote(execute)),
      new Separator(),
      new Button('Preview', 'View the rendered page alongside your Markdown', 'columns',
                  ButtonState.Disabled, (execute) => null),
    );
  }

  cancelSave() {
    this.editor.cancelSave();
    this.handleEditorChange();
    this.editor.takeFocus();
  }

  doSave() {
    if (this.commitMessage.length > 0) {
      this.editor.save(this.commitMessage).then(val => {
        this.editor.setMode(EditorMode.Edit);
        this.editor.takeFocus();
      });
    }
  }

  handleClick(button: Button) {
    if (button.state === ButtonState.Disabled) {
      return;
    }
    button.state = button.callback(true);
    this.editor.takeFocus();
  }

  handleEditorChange() {
    for (const item of this.items) {
      if (!(item instanceof Button)) {
        continue;
      }
      const button = item as Button;

      if (this.editor.markdownConfig.name.length === 0) {
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
