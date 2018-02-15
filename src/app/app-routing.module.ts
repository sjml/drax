import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlSegment, UrlMatchResult } from '@angular/router';

import { FileBrowserComponent } from './filebrowser/filebrowser.component';
import { PagesComponent } from './pages/pages.component';
import { EditorComponent } from './editor/editor.component';

import * as cmBrowser from 'codemirror/src/util/browser';

// TODO
// if (cmBrowser.mobile) {
//   // use CM's detection for this since it's the part causing problems
//   const p = new UrlSegment('pages', {});
//   const s = new UrlSegment('sadness', {});
//   return {consumed: [p, s], posParams: {pageName: s}};
// }
export function repoBranchMatcher(urlSegs: UrlSegment[]): UrlMatchResult {
  return null;
}

export const routes: Routes = [
  {
    path: 'pages/:pageName',
    component: PagesComponent
  },
  {
    path: 'edit',
    children: [{
      path: '**',
      component: EditorComponent
    }]
  }
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes, { useHash: true }) ]
})
export class AppRoutingModule { }
