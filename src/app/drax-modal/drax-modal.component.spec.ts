import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DraxModalComponent } from './drax-modal.component';

describe('DraxModalComponent', () => {
  let component: DraxModalComponent;
  let fixture: ComponentFixture<DraxModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DraxModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DraxModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
