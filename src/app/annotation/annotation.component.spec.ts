import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AnnotationComponent } from './annotation.component';
import { Annotation } from './annotation';

@Component({
  template: '<app-annotation [ann]="ann"></app-annotation>'
})
class AnnotationContainerMockComponent {
  @ViewChild(AnnotationComponent) annComp;
  ann: Annotation;
}

describe('AnnotationComponent', () => {
  let testHost: AnnotationContainerMockComponent;
  let component: AnnotationComponent;
  let fixture: ComponentFixture<AnnotationContainerMockComponent>;

  const newAnn = new Annotation();
  newAnn.author = 'testAuthor1';
  newAnn.from = {line: 1, ch: 10};
  newAnn.to = {line: 1, ch: 20};
  newAnn.text = 'Other annotation content';
  newAnn.timestamp = 0;
  newAnn.extents = { left: 0, top: 10, bottom: 20};

  const ann1 = new Annotation();
  ann1.author = 'testAuthor2';
  ann1.from = {line: 0, ch: 10};
  ann1.to = {line: 0, ch: 20};
  ann1.text = 'Annnotation content';
  ann1.timestamp = Date.now();
  ann1.extents = { left: 0, top: 0, bottom: 10};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnnotationComponent, AnnotationContainerMockComponent ],
      imports: [ FormsModule ]
    })
    .compileComponents();

    AnnotationComponent.clearColorMapping();
  }));

  afterEach(() => {
    if (fixture && fixture.debugElement) {
      document.body.removeChild(fixture.debugElement.nativeElement);
    }
  });

  describe('new annotation', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(AnnotationContainerMockComponent);
      testHost = fixture.componentInstance;

      testHost.ann = newAnn;
      fixture.detectChanges();
      component = testHost.annComp;
    });

    it('starts editing if timestamp is zero', () => {
      expect(component.ann.timestamp).toEqual(0);
      expect(component.editing).toEqual(true);
    });

    it('sets initial strings properly', () => {
      expect(component.colorString).toEqual('color1');
      expect(component.shortDateString.length).toEqual(0);
      expect(component.fullDateString.length).toEqual(0);
    });
  });

  describe('regular annotation', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(AnnotationContainerMockComponent);
      testHost = fixture.componentInstance;

      testHost.ann = ann1;
      fixture.detectChanges();
      component = testHost.annComp;
    });

    it('starts displayed if timestamp is non-zero', () => {
      expect(component.ann.timestamp).not.toEqual(0);
      expect(component.editing).toEqual(false);
    });

    it('sets initial strings properly', () => {
      expect(component.colorString).toEqual('color1');
      expect(component.shortDateString.length).toBeGreaterThan(0);
      expect(component.fullDateString.length).toBeGreaterThan(0);
    });

    it('sets up the interval to update its time every minute', () => {
      expect(component.checkInterval).toBeTruthy();
    });

    it('clears the interval on destruction', () => {
      fixture.destroy();
      expect(component.checkInterval).toBeNull();
    });

    // check heightvar, same as nativeelement height
    // do editing --> height difference check
    // set topvar to something different
    // make sure they reset when resetVars is called

    // ensure tryEdit doesn't do anything if we're already editing
    // same with stopEdit if we're not

    // check that nothing else changes if text didn't change
    // check for new timestamp when text changed
    // check that setStrings was called and new values are in place

    // ensure that removeme sets values and emits
  });

});
