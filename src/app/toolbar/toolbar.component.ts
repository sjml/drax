import { Component, OnInit, Input } from '@angular/core';

import { EditorComponent } from '../editor/editor.component';

class ToolbarItem {}

enum ButtonState {
  Disabled = 'disabled',
  Active = 'active',
  Inactive = 'inactive'
}

class Button extends ToolbarItem {
  name: string;
  toolTip: string;
  icon: string;
  isToggle = true;
  state: ButtonState = ButtonState.Inactive;
  fn = null;

  constructor(name: string, tooltip: string, icon: string, isToggle: boolean, startingState: ButtonState, fn) {
    super();
    this.name = name;
    this.toolTip = tooltip;
    this.icon = icon;
    this.isToggle = isToggle;
    this.state = startingState;
    this.fn = fn;
  }
}

class Separator extends ToolbarItem {}


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  items: ToolbarItem[] = [];

  @Input('editor') editor: EditorComponent;

  constructor() { }

  ngOnInit() {
    this.items.push(
      // new Button('Save', 'Sync your changes back to GitHub', 'icon-floppy',
      //            false, ButtonState.Inactive),
      // new Separator(),
      new Button('Bold', 'Change text to bold', 'icon-bold',
                 true, ButtonState.Inactive, this.editor.toggleBold),
      new Button('Italics', 'Change text to italics', 'icon-italic',
                 true, ButtonState.Inactive, this.editor.toggleItalics),
    );
  }

  handleClick(button: Button) {
    if (button.state === ButtonState.Disabled) {
      return;
    }
    // console.log(button.name + ' pressed!');
    // button.fn();

    if (button.name === 'Bold') {
      this.editor.toggleBold();
    }
    else if (button.name === 'Italics') {
      this.editor.toggleItalics();
    }
  }

}
