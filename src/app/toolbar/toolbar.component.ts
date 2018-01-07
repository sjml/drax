import { Component, OnInit, Input } from '@angular/core';

import { EditorComponent, EditorMode } from '../editor/editor.component';

abstract class ToolbarItem {
  public itemType = 'ITEM';
}

export enum ButtonState {
  Disabled = 'disabled',
  Active = 'active',
  Inactive = 'inactive'
}

class Button extends ToolbarItem {
  public itemType = 'BUTTON';
  public name: string;
  public toolTip: string;
  public icon: string;
  public state: ButtonState = ButtonState.Inactive;
  public callback: (execute: boolean) => ButtonState = null;

  constructor(name: string,
              tooltip: string,
              icon: string,
              startingState: ButtonState,
              callback: (execute: boolean) => ButtonState,
            ) {
    super();
    this.name = name;
    this.toolTip = tooltip;
    this.icon = icon;
    this.state = startingState;
    this.callback = callback;
  }
}

class Separator extends ToolbarItem {
  public itemType = 'SEP';
}


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
      new Button('Save', 'Sync your changes back to GitHub', 'icon-floppy',
                  ButtonState.Disabled, (execute) => this.editor.prepForSave(execute)),
      new Button('Refresh', 'Refresh file from GitHub', 'icon-arrows-cw',
                  ButtonState.Disabled, (execute) => this.editor.refreshContents(execute)),
      // new Button('History', 'View history of file changes', 'icon-history',
      //             ButtonState.Disabled, () => true),
      new Separator(),
      new Button('Bold', 'Change text to bold', 'icon-bold',
                  ButtonState.Inactive, (execute) => this.editor.toggleBold(execute)),
      new Button('Italics', 'Change text to italics', 'icon-italic',
                  ButtonState.Inactive, (execute) => this.editor.toggleItalics(execute)),
      new Button('Header', 'Cycle through header levels', 'icon-header',
                  ButtonState.Inactive, (execute) => this.editor.cycleHeaderLevel(execute)),
      new Separator(),
      new Button('Link', 'Add website link', 'icon-link',
                  ButtonState.Inactive, (execute) => this.editor.createLink(execute)),
      new Button('Bulleted List', 'Create a bulleted list', 'icon-list-bullet',
                  ButtonState.Inactive, (execute) => this.editor.toggleBulletList(execute)),
      // new Button('Numbered List', 'Create a numbered list', 'icon-list-numbered',
      //             ButtonState.Disabled, () => true),
      new Separator(),
      new Button('Code', 'Change text to monospaced', 'icon-code',
                  ButtonState.Inactive, (execute) => this.editor.toggleCode(execute)),
      new Button('Strikethrough', 'Cross out text', 'icon-strike',
                  ButtonState.Inactive, (execute) => this.editor.toggleStrikethrough(execute)),
      new Button('Blockquote', 'Create a blockquote', 'icon-quote-left',
                  ButtonState.Inactive, (execute) => this.editor.toggleBlockQuote(execute)),
      new Separator(),
      new Button('Preview', 'View the rendered page alongside your Markdown', 'icon-columns',
                  ButtonState.Disabled, (execute) => null),
    );
  }

  cancelSave() {
    this.editor.cancelSave();
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
