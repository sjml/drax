import { Component, OnInit, Input } from '@angular/core';

import { GitHubFile, GitHubRepo } from '../githubaccess/githubaccess.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  @Input() file: GitHubFile;

  constructor() { }

  ngOnInit() {
  }

}
