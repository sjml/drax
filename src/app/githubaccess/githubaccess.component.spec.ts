import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GitHubAccessComponent } from './githubaccess.component';

describe('GitHubAccessComponent', () => {
  let component: GitHubAccessComponent;
  let fixture: ComponentFixture<GitHubAccessComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GitHubAccessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GitHubAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
