import { Component, OnInit, Input } from '@angular/core';

import { GenericEditor, EditorMode } from '../editor/editor.base';

abstract class ToolbarItem {
  public itemType = 'ITEM';
}

enum ButtonState {
  Disabled = 'disabled',
  Active = 'active',
  Inactive = 'inactive'
}

class Button extends ToolbarItem {
  public itemType = 'BUTTON';
  public name: string;
  public toolTip: string;
  public icon: string;
  public isToggle = true;
  public state: ButtonState = ButtonState.Inactive;
  public callback: () => boolean = null;

  constructor(name: string, tooltip: string, icon: string, isToggle: boolean, startingState: ButtonState, fn: () => boolean) {
    super();
    this.name = name;
    this.toolTip = tooltip;
    this.icon = icon;
    this.isToggle = isToggle;
    this.state = startingState;
    this.callback = fn;
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

  @Input('editor') editor: GenericEditor;

  commitMessage = '';

  constructor() { }

  ngOnInit() {
    this.editor.change.subscribe(() => this.handleEditorChange());
    this.items.push(
      new Button('Save', 'Sync your changes back to GitHub', 'icon-floppy',
                  false, ButtonState.Disabled, () => this.editor.prepForSave()),
      new Button('Refresh', 'Refresh file from GitHub', 'icon-arrows-cw',
                  false, ButtonState.Disabled, () => this.editor.refreshContents()),
      new Button('History', 'View history of file changes', 'icon-history',
                  false, ButtonState.Disabled, () => true),
      new Separator(),
      new Button('Bold', 'Change text to bold', 'icon-bold',
                  true, ButtonState.Inactive, () => this.editor.toggleBold()),
      new Button('Italics', 'Change text to italics', 'icon-italic',
                  true, ButtonState.Inactive, () => this.editor.toggleItalics()),
      new Button('Header', 'Cycle through header levels', 'icon-header',
                  true, ButtonState.Inactive, () => this.editor.cycleHeaderLevel()),
      new Separator(),
      new Button('Link', 'Add website link', 'icon-link',
                  false, ButtonState.Inactive, () => this.editor.createLink()),
      new Button('Bulleted List', 'Create a bulleted list', 'icon-list-bullet',
                  false, ButtonState.Inactive, () => this.editor.toggleBulletList()),
      // new Button('Numbered List', 'Create a numbered list', 'icon-list-numbered',
      //             false, ButtonState.Disabled, () => true),
      new Separator(),
      new Button('Code', 'Change text to monospaced', 'icon-code',
                  false, ButtonState.Inactive, () => this.editor.toggleCode()),
      new Button('Strikethrough', 'Cross out text', 'icon-strike',
                  false, ButtonState.Inactive, () => this.editor.toggleStrikethrough()),
      new Button('Blockquote', 'Create a blockquote', 'icon-quote-left',
                  false, ButtonState.Inactive, () => this.editor.toggleBlockQuote()),
      new Separator(),
      new Button('Preview', 'View the rendered page alongside your Markdown', 'icon-columns',
                  false, ButtonState.Disabled, () => true),
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
    button.callback();
    this.editor.takeFocus();
  }

  // TODO: be smarter about this than directly using array index
  handleEditorChange() {
    // TODO: reintegrate this
    // if (this.editor.file.isDirty) {
    //   (this.items[0] as Button).state = ButtonState.Inactive;
    // }
    // else {
    //   (this.items[0] as Button).state = ButtonState.Disabled;
    // }

    // if (this.editor.fileOutOfSync) {
    //   (this.items[1] as Button).state = ButtonState.Inactive;
    // }
    // else {
    //   (this.items[1] as Button).state = ButtonState.Disabled;
    // }
  }
}
