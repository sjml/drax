import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { TextareaAutosizeModule } from 'ngx-textarea-autosize';

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
import { AnnotationContainerComponent } from './annotation-container/annotation-container.component';
import { AnnotationComponent } from './annotation/annotation.component';

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
    AnnotationContainerComponent,
    AnnotationComponent
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
