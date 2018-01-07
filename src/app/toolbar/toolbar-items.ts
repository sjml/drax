export abstract class ToolbarItem {
  public itemType = 'ITEM';
}

export enum ButtonState {
  Disabled = 'disabled',
  Active = 'active',
  Inactive = 'inactive'
}

export class Button extends ToolbarItem {
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

export class Separator extends ToolbarItem {
  public itemType = 'SEP';
}
