import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileHistoryModalComponent } from './file-history-modal.component';

xdescribe('FileHistoryModalComponent', () => {
  let component: FileHistoryModalComponent;
  let fixture: ComponentFixture<FileHistoryModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileHistoryModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileHistoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
