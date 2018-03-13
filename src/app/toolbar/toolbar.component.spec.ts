import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement, EventEmitter, ViewChild } from '@angular/core';

import { ToolbarComponent } from './toolbar.component';
import { ToolbarItem, Button, ButtonState, Separator } from '../toolbar/toolbar-items';
import { EditorComponent, EditorMode } from '../editor/editor.component';


let stubButtonReturn: ButtonState = null;

@Component({
  template: '<app-toolbar [editor]="this"></app-toolbar>'
})
class EditorMockComponent {
  prepForSave = this.stubButtonFunction;
  prepRefresh = this.stubButtonFunction;
  showHistory = this.stubButtonFunction;
  toggleBold = this.stubButtonFunction;
  toggleItalics = this.stubButtonFunction;
  cycleHeaderLevel = this.stubButtonFunction;
  createLink = this.stubButtonFunction;
  toggleBulletList = this.stubButtonFunction;
  toggleCode = this.stubButtonFunction;
  toggleStrikethrough = this.stubButtonFunction;
  toggleBlockQuote = this.stubButtonFunction;
  createNewAnnotationCommand = this.stubButtonFunction;
  toggleAnnotationGutter = this.stubButtonFunction;

  markdownConfig = { name: 'markdown' };
  mode: EditorMode = EditorMode.Edit;

  change = new EventEmitter();
  cursorActivity = new EventEmitter();

  @ViewChild(ToolbarComponent) toolbar;

  stubCalledCount = 0;
  stubButtonFunction(execute: boolean): ButtonState {
    this.stubCalledCount += 1;
    return stubButtonReturn;
  }

  takeFocus() {}

}

describe('ToolbarComponent', () => {
  let testHost: EditorMockComponent;
  let component: ToolbarComponent;
  let fixture: ComponentFixture<EditorMockComponent>;
  let handleChangeSpy: jasmine.Spy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ToolbarComponent, EditorMockComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorMockComponent);
    testHost = fixture.componentInstance;
    fixture.detectChanges();
    component = testHost.toolbar;

    handleChangeSpy = spyOn(component, 'handleEditorChange').and.callThrough();
  });

  afterEach(() => {
    if (fixture && fixture.debugElement) {
      document.body.removeChild(fixture.debugElement.nativeElement);
    }
  });

  it('should be created with 13 buttons and 5 separators', () => {
    let buttonCount = 0;
    let sepCount = 0;
    for (const item of component.items) {
      if (item instanceof Button) {
        buttonCount += 1;
      }
      else if (item instanceof Separator) {
        sepCount += 1;
      }
    }

    expect(buttonCount).toEqual(13);
    expect(sepCount).toEqual(5);
  });

  it('has the expected button ordering for tests', () => {
    const save = component.items[0];
    const bold = component.items[5];
    expect(save.itemType).toBe('BUTTON');
    expect(bold.itemType).toBe('BUTTON');
    const saveButton = save as Button;
    const boldButton = bold as Button;
    expect(saveButton.name).toBe('Save');
    expect(boldButton.name).toBe('Bold');
  });

  it('responds to editor changes with evaluation', () => {
    expect(handleChangeSpy.calls.count()).toEqual(0);
    testHost.change.emit();
    expect(handleChangeSpy.calls.count()).toEqual(1);
    testHost.cursorActivity.emit();
    expect(handleChangeSpy.calls.count()).toEqual(2);
  });

  it('sets buttons appropriately when probing functions', () => {
    stubButtonReturn = null;
    testHost.change.emit();
    for (const b of component.items) {
      if (b instanceof Button) {
        expect(b.state).toEqual(ButtonState.Disabled);
      }
    }

    const button = component.items[5] as Button;
    stubButtonReturn = ButtonState.Active;
    testHost.change.emit();
    expect(button.state).toEqual(ButtonState.Inactive);

    stubButtonReturn = ButtonState.Inactive;
    testHost.change.emit();
    expect(button.state).toEqual(ButtonState.Active);
  });

  it('does not respond to clicks when disabled', () => {
    const button = component.items[5] as Button;
    button.state = ButtonState.Disabled;

    const preClickScc = testHost.stubCalledCount;
    const res = component.handleClick(button);
    expect(res).toBe(false);
    expect(testHost.stubCalledCount).toBe(preClickScc);
  });

  it('responds to clicks when active or inactive', () => {
    const button = component.items[5] as Button;
    button.state = ButtonState.Active;

    const preClickScc = testHost.stubCalledCount;
    const res = component.handleClick(button);
    expect(res).toBe(true);
    expect(testHost.stubCalledCount).toBe(preClickScc + 1);
  });

  it('partially disables when editor is not in markdown mode', () => {
    stubButtonReturn = ButtonState.Inactive;
    const save = component.items[0] as Button;
    const bold = component.items[5] as Button;
    save.state = ButtonState.Active;
    bold.state = ButtonState.Active;
    testHost.markdownConfig.name = '';
    testHost.change.emit();

    expect(save.state).toBe(ButtonState.Active);
    expect(bold.state).toBe(ButtonState.Disabled);
  });

  it('disables everything when editor is locked', () => {
    testHost.mode = EditorMode.Locked;
    testHost.change.emit();
    for (const item of component.items) {
      if (item instanceof Button) {
        expect(item.state).toBe(ButtonState.Disabled);
      }
    }
  });
});
