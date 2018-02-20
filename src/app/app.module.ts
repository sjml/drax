import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { TextareaAutosizeModule } from 'ngx-textarea-autosize';

import { ConfigService } from './config.service';
import { GitHubService } from './githubservice/github.service';
import { ModalService } from './modals/modal.service';
import { MobileGuard } from './mobile.guard';

import { AppComponent } from './app.component';
import { FileBrowserComponent } from './filebrowser/filebrowser.component';
import { EditorComponent } from './editor/editor.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { AppRoutingModule } from './app-routing.module';
import { PagesComponent } from './pages/pages.component';
import { DraxModalComponent } from './modals/drax-modal/drax-modal.component';
import { DataRequestModalComponent } from './modals/data-request-modal/data-request-modal.component';
import { FileHistoryModalComponent } from './modals/file-history-modal/file-history-modal.component';
import { AnnotationContainerComponent } from './annotation-container/annotation-container.component';
import { AnnotationComponent } from './annotation/annotation.component';
import { FileBrowserEntryComponent } from './filebrowserentry/filebrowserentry.component';
import { PlaygroundComponent } from './playground/playground.component';
import { BinaryViewerComponent } from './binaryviewer/binaryviewer.component';

@NgModule({
  declarations: [
    AppComponent,
    FileBrowserComponent,
    FileBrowserEntryComponent,
    EditorComponent,
    ToolbarComponent,
    PagesComponent,
    DraxModalComponent,
    DataRequestModalComponent,
    FileHistoryModalComponent,
    AnnotationContainerComponent,
    AnnotationComponent,
    PlaygroundComponent,
    BinaryViewerComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    TextareaAutosizeModule
  ],
  providers: [
    ConfigService,
    GitHubService,
    ModalService,
    MobileGuard,
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
