import { TestBed, inject } from '@angular/core/testing';

import { GitHubService } from './github.service';

xdescribe('GithubService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GitHubService]
    });
  });

  it('should be created', inject([GitHubService], (service: GitHubService) => {
    expect(service).toBeTruthy();
  }));
});
