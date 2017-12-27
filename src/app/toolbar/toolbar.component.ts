import { Component, OnInit } from '@angular/core';

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

  constructor(name: string, tooltip: string, icon: string, isToggle: boolean, startingState: ButtonState) {
    super();
    this.name = name;
    this.toolTip = tooltip;
    this.icon = icon;
    this.isToggle = isToggle;
    this.state = startingState;
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

  constructor() { }

  ngOnInit() {
    this.items.push(
      new Button('Save', 'Sync your changes back to GitHub', 'icon-floppy',
                 false, ButtonState.Inactive),
      // new Separator(),
      // new Button('Bold', 'Change text to bold', 'icon-bold',
      //            true, ButtonState.Inactive),
      // new Button('Italics', 'Change text to italics', 'icon-italic',
      //            true, ButtonState.Inactive),
    );
  }

  handleClick(button: Button) {
    if (button.state === ButtonState.Disabled) {
      return;
    }
    console.log(button.name + ' pressed!');
  }

}
