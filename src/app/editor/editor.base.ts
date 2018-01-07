import { Output, EventEmitter } from '@angular/core';

export enum EditorMode {
  Edit = 'edit',
  Locked = 'locked'
}

export abstract class GenericEditor {
  change: EventEmitter<{}>;
  mode: EditorMode;

  constructor() {
    this.change = new EventEmitter();
    this.mode = EditorMode.Edit;
  }

  takeFocus() {}
  setMode(newMode: EditorMode) {}

  refreshContents(): boolean {
    return true;
  }

  prepForSave(): boolean {
    return true;
  }

  cancelSave(): boolean {
    return true;
  }

  save(commitMessage: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  cycleHeaderLevel(): boolean {
    return true;
  }

  toggleBlockQuote(): boolean {
    return true;
  }

  toggleBulletList(): boolean {
    return true;
  }

  createLink(): boolean {
    return true;
  }

  toggleBold(): boolean {
    return true;
  }

  toggleItalics(): boolean {
    return true;
  }

  toggleCode(): boolean {
    return true;
  }

  toggleStrikethrough(): boolean {
    return true;
  }

}
