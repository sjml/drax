import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { FileBrowserEntryComponent } from './filebrowserentry.component';
import { GitHubService } from '../githubservice/github.service';
import { GitHubNavNode, GitHubRepo, GitHubItem } from '../githubservice/githubclasses';

@Component({
  template: '<app-filebrowserentry [parent]="this" [navItem]="node"></app-filebrowserentry>'
})
class FileBrowserTestComponent {
  node: GitHubNavNode = null;
  item: GitHubItem = null;

  loadedNode: GitHubNavNode = null;
  loadNode(passedNode: GitHubNavNode) {
    this.loadedNode = passedNode;
  }
}

describe('FileBrowserEntryComponent', () => {
  let testHost: FileBrowserTestComponent;
  let fixture: ComponentFixture<FileBrowserTestComponent>;
  let entryEl: DebugElement;

  let ownedRepo: GitHubRepo;
  let unownedRepo: GitHubRepo;
  let directory: GitHubItem;
  let file: GitHubItem;
  let otherFile: GitHubItem;

  beforeEach(async(() => {
    const fakeGitHubService = {
      user: {
        login: 'notTestOwner'
      }
    };

    TestBed.configureTestingModule({
      declarations: [ FileBrowserEntryComponent, FileBrowserTestComponent ],
      providers: [{provide: GitHubService, useValue: fakeGitHubService}]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    unownedRepo = new GitHubRepo();
    unownedRepo.owner = 'testOwner';
    unownedRepo.name = 'testName';

    ownedRepo = new GitHubRepo();
    ownedRepo.owner = 'notTestOwner';
    ownedRepo.name = 'testName';

    directory = new GitHubItem();
    directory.fileName = 'testDir';
    directory.isDirectory = true;
    directory.repo = ownedRepo;

    file = new GitHubItem();
    file.fileName = 'testFile';
    file.isDirectory = false;
    file.repo = ownedRepo;

    otherFile = new GitHubItem();
    otherFile.fileName = 'other';
    otherFile.isDirectory = false;
    otherFile.repo = unownedRepo;

    fixture = TestBed.createComponent(FileBrowserTestComponent);
    testHost = fixture.componentInstance;
    testHost.item = otherFile;

    entryEl = fixture.debugElement.query(By.css('.fileBrowserNode'));
    fixture.detectChanges();
  });

  it('should tell its parent to load when clicked', () => {
    testHost.node = unownedRepo;
    fixture.detectChanges();

    // TODO: change this to use spy
    expect(testHost.loadedNode).toEqual(null);
    entryEl.triggerEventHandler('click', { button: 0 });
    expect(testHost.loadedNode).toEqual(unownedRepo);
  });

  it('should display a repository', () => {
    testHost.node = unownedRepo;
    fixture.detectChanges();

    expect(entryEl.nativeElement.textContent).toContain('testName');
    expect(entryEl.nativeElement.textContent).toContain('testOwner');

    testHost.node = ownedRepo;
    fixture.detectChanges();

    expect(entryEl.nativeElement.textContent).toContain('testName');
    expect(entryEl.nativeElement.textContent).not.toContain('testOwner');

    expect(entryEl.nativeElement.innerHTML).toContain('chevron');
  });

  it('should display a file', () => {
    testHost.node = file;
    fixture.detectChanges();

    expect(entryEl.nativeElement.textContent).toContain('testFile');
    expect(entryEl.nativeElement.innerHTML).not.toContain('chevron');
  });

  it('should display a directory', () => {
    testHost.node = directory;
    fixture.detectChanges();

    expect(entryEl.nativeElement.textContent).toContain('testDir');
    expect(entryEl.nativeElement.innerHTML).toContain('chevron');
  });
});
