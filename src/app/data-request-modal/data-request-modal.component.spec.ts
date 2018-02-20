import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataRequestModalComponent } from './data-request-modal.component';

xdescribe('DataRequestModalComponent', () => {
  let component: DataRequestModalComponent;
  let fixture: ComponentFixture<DataRequestModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataRequestModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataRequestModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
