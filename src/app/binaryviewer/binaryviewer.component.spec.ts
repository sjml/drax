import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BinaryViewerComponent } from './binaryviewer.component';

xdescribe('BinaryViewerComponent', () => {
  let component: BinaryViewerComponent;
  let fixture: ComponentFixture<BinaryViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BinaryViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BinaryViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
