import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { ConfigService } from './config.service';
import { ModalService } from './drax-modal/modal.service';
import { GitHubAccessComponent } from './githubaccess/githubaccess.component';
import { EditorComponent } from './editor/editor.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { AppRoutingModule } from './/app-routing.module';
import { PagesComponent } from './pages/pages.component';
import { DraxModalComponent } from './drax-modal/drax-modal.component';
import { DataRequestModalComponent } from './drax-modal/data-request-modal.component';
import { FileHistoryModalComponent } from './editor/file-history-modal.component';
import { AnnotationsComponent } from './annotations/annotations.component';

@NgModule({
  declarations: [
    AppComponent,
    GitHubAccessComponent,
    EditorComponent,
    ToolbarComponent,
    PagesComponent,
    DraxModalComponent,
    DataRequestModalComponent,
    FileHistoryModalComponent,
    AnnotationsComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    ConfigService,
    ModalService,
    {
      provide: APP_INITIALIZER,
      useFactory: (config: ConfigService) => () => config.load(),
      deps: [ConfigService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
