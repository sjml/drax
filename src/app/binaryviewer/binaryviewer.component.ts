import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';

import { GitHubService } from '../githubservice/github.service';
import { GitHubItem } from '../githubservice/githubclasses';

@Component({
  selector: 'app-binaryviewer',
  templateUrl: './binaryviewer.component.html',
  styleUrls: ['./binaryviewer.component.scss']
})
export class BinaryViewerComponent implements OnInit {

  gitHubLink: string = null;
  item: GitHubItem = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private gitHubService: GitHubService
  ) {}

  ngOnInit() {
    this.route.url.subscribe(url => {
      this.loadFromUrl(url);
    });
  }

  // NB: there's a mirror image of this in EditorComponent
  private async loadFromUrl(urlSegs: UrlSegment[]) {
    const data = this.gitHubService.getDataFromUrl(urlSegs);

    const itemLoaded = await this.gitHubService.loadItemData(data.item);
    if (!itemLoaded) {
      this.router.navigateByUrl('/');
      return;
    }
    if (!data.item.isBinary) {
      this.router.navigate(['edit'].concat(data.item.getRouterPath()));
      return;
    }

    this.item = data.item;
    this.gitHubLink = this.item.getGitHubLink();

    // maybe in the future this component will allow for viewing of images or something
    // this.file = await this.gitHubService.getFile(data.item);
  }

}
