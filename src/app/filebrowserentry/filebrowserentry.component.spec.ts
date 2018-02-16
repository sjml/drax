import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileBrowserEntryComponent } from './filebrowserentry.component';

describe('FileBrowserEntryComponent', () => {
  let component: FileBrowserEntryComponent;
  let fixture: ComponentFixture<FileBrowserEntryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileBrowserEntryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileBrowserEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
