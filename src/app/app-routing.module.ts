import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlSegment, UrlMatchResult } from '@angular/router';

import { MobileGuard } from './mobile.guard';
import { FileBrowserComponent } from './filebrowser/filebrowser.component';
import { PagesComponent } from './pages/pages.component';
import { EditorComponent } from './editor/editor.component';
import { PlaygroundComponent } from './playground/playground.component';
import { BinaryViewerComponent } from './binaryviewer/binaryviewer.component';


export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/pages/about'
  },
  {
    path: 'pages/:pageName',
    component: PagesComponent
  },
  {
    path: 'playground',
    canActivate: [MobileGuard],
    component: PlaygroundComponent
  },
  {
    path: 'edit',
    canActivate: [MobileGuard],
    children: [{
      path: '**',
      component: EditorComponent
    }]
  },
  {
    path: 'bin',
    children: [{
      path: '**',
      component: BinaryViewerComponent
    }]
  }
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes, { useHash: true }) ]
})
export class AppRoutingModule { }
