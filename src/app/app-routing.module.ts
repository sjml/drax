import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlSegment, UrlMatchResult } from '@angular/router';

import { GitHubAccessComponent } from './githubaccess/githubaccess.component';
import { PagesComponent } from './pages/pages.component';

export function repoBranchMatcher(urlSegs: UrlSegment[]): UrlMatchResult {
  if (urlSegs.length < 2) {
    return {consumed: urlSegs, posParams: {}};
  }
  const consumed: UrlSegment[] = [];
  const params = {};

  const seg0 = urlSegs[0];
  const seg1 = urlSegs[1];

  if (seg0.path === 'pages') {
    params['pageName'] = seg1;
    consumed.push(seg0, seg1);
    return {consumed: consumed, posParams: params};
  }

  consumed.push(seg0);
  params['owner'] = seg0;

  const splits = seg1.path.split(':');
  params['name'] = new UrlSegment(splits[0], {});
  if (splits.length > 1) {
    params['branch'] = new UrlSegment(splits[1], {});
  }
  consumed.push(seg1);

  if (urlSegs.length > 2) {
    const pathSegs = urlSegs.slice(2).map(urlSeg => {
      consumed.push(urlSeg);
      return urlSeg.path;
    });
    const lastSeg = pathSegs.pop();
    params['dirPath'] = new UrlSegment(pathSegs.join('/'), {});
    params['itemName'] = new UrlSegment(lastSeg, {});
  }

  return {consumed: consumed, posParams: params};
}

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/pages/about'
  },
  {
    matcher: repoBranchMatcher,
    component: GitHubAccessComponent
  }
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes, { useHash: true }) ]
})
export class AppRoutingModule { }
