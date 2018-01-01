import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
// import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { GitHubAccessComponent } from './githubaccess/githubaccess.component';
import { EditorComponent } from './editor/editor.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { AppRoutingModule } from './/app-routing.module';

// import { getBaseLocation } from './shared/util';

@NgModule({
  declarations: [
    AppComponent,
    GitHubAccessComponent,
    EditorComponent,
    ToolbarComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    // {
    //   provide: APP_BASE_HREF,
    //   useFactory: getBaseLocation
    // }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
