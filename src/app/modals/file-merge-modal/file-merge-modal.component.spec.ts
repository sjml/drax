import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileMergeModalComponent } from './file-merge-modal.component';

xdescribe('FileMergeModalComponent', () => {
  let component: FileMergeModalComponent;
  let fixture: ComponentFixture<FileMergeModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileMergeModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileMergeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
