import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationContainerComponent } from './annotation-container.component';

xdescribe('AnnotationContainerComponent', () => {
  let component: AnnotationContainerComponent;
  let fixture: ComponentFixture<AnnotationContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnnotationContainerComponent ]
    })

    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnotationContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // test annotation sorting
  // two annotations by same author have same color
  // five annotation authors have different colors; sixth is the same

  // test annotations changing height when their content changes

});
