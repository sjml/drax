import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlSegment, UrlMatchResult } from '@angular/router';

import { GitHubAccessComponent } from './githubaccess/githubaccess.component';

function repoBranchMatcher(urlSegs: UrlSegment[]): UrlMatchResult {
  if (urlSegs.length < 2) {
    return {consumed: urlSegs, posParams: {}};
  }
  const consumed: UrlSegment[] = [];
  const params = {};

  const ownerSeg = urlSegs[0];
  consumed.push(ownerSeg);
  params['owner'] = ownerSeg;

  const repoBranchSeg = urlSegs[1];
  const splits = repoBranchSeg.path.split(':');
  params['name'] = new UrlSegment(splits[0], {});
  if (splits.length > 1) {
    params['branch'] = new UrlSegment(splits[1], {});
  }
  consumed.push(repoBranchSeg);

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

const routes: Routes = [
  {
    matcher: repoBranchMatcher,
    component: GitHubAccessComponent
  }
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes) ]
})
export class AppRoutingModule { }
