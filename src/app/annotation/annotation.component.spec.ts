import { async, fakeAsync, tick, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AnnotationComponent } from './annotation.component';
import { Annotation } from './annotation';

import * as c from 'cassowary';

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

    it('handles color requests properly', () => {
      AnnotationComponent.clearColorMapping();
      const authors = ['A', 'B', 'C', 'D', 'E', 'F'];
      const maxColors = 5;
      for (let i = 0; i < authors.length; i++) {
        const colorIndex = AnnotationComponent.getColorIndex(authors[i]);
        expect(colorIndex).toEqual((i % maxColors) + 1);
      }
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

    it('has a non-zero height that matches the native element', () => {
      expect(component.heightVar.value).toBeGreaterThan(0);
      expect(component.heightVar.value).toEqual(component.annChild.nativeElement.offsetHeight);
    });

    it('resets values appropriately', () => {
      component.topVar.value = 1;
      component.heightVar.value = 0;
      component.resetVars();
      expect(component.topVar.value).not.toEqual(1);
      expect(component.heightVar.value).not.toEqual(0);
      expect(component.topVar.value).toEqual(component.ann.extents.top);
      expect(component.heightVar.value).toEqual(component.annChild.nativeElement.offsetHeight);
    });

    it('checks editing status for starting and stopping', fakeAsync(() => {
      expect(component.stopEdit()).toEqual(false);
      expect(component.tryEdit()).toEqual(true);

      fixture.detectChanges();
      tick();

      expect(component.tryEdit()).toEqual(false);
      expect(component.stopEdit()).toEqual(true);
    }));

    it('changes timestamp when the text is updated', fakeAsync(() => {
      const origStamp = component.ann.timestamp;
      component.tryEdit();
      fixture.detectChanges();
      tick();
      component.ann.text = 'New text';
      component.stopEdit();
      expect(component.ann.timestamp).toBeGreaterThan(origStamp);
    }));

    it('keeps the timestamp if the text is the same', fakeAsync(() => {
      const origStamp = component.ann.timestamp;
      component.tryEdit();
      fixture.detectChanges();
      tick();
      component.stopEdit();
      expect(component.ann.timestamp).toEqual(origStamp);
    }));
  });

});
