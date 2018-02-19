import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationContainerComponent } from './annotation-container.component';

describe('AnnotationContainerComponent', () => {
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
});
