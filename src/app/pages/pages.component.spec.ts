import { async, fakeAsync, tick, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PagesComponent } from './pages.component';
import { ActivatedRouteStub } from '../../testing/router-stubs';
import { NotificationService } from '../notifications/notification.service';
import { NotificationLevel } from '../notifications/notification';

class RouterStub {
  routedUrl: string;

  navigateByUrl(url: string) {
    this.routedUrl = url;
    return this.routedUrl;
  }
}

class NotificationServiceStub {
  notify(title: string, text: string, timing: number = 3250, type: NotificationLevel = NotificationLevel.Info) {
    // nada
  }
}

describe('PagesComponent', () => {
  let component: PagesComponent;
  let fixture: ComponentFixture<PagesComponent>;
  let httpMock: HttpTestingController;
  let activatedRouteStub: ActivatedRouteStub;
  let routerStub: RouterStub;

  function createPagesComponent() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ PagesComponent ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: NotificationService, useClass: NotificationServiceStub }
      ]
    })
    .compileComponents();

    httpMock = TestBed.get(HttpTestingController);
    routerStub = TestBed.get(Router);

    fixture = TestBed.createComponent(PagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    httpMock.verify();
    if (fixture && fixture.debugElement) {
      document.body.removeChild(fixture.debugElement.nativeElement);
    }
  });

  beforeEach(() => {
    activatedRouteStub = new ActivatedRouteStub();
  });

  it('should redirect if null page given', async(() => {
    activatedRouteStub.testParamMap = { pageName: null };
    createPagesComponent();
    expect(routerStub.routedUrl).toBe('/');
  }));

  it('should request pageName', fakeAsync(() => {
    const testPage = 'testPage';
    activatedRouteStub.testParamMap = { pageName: testPage };
    createPagesComponent();

    const pageMatch = /^\.\/assets\/pages\/testPage\.md\?[0-9]*$/;
    const mockRequest = httpMock
        .expectOne(req => req.method === 'GET' && req.url.match(pageMatch) !== null);
    expect(mockRequest.cancelled).toBeFalsy();
    expect(mockRequest.request.responseType).toEqual('text');
    mockRequest.flush('# Test Page\n\nWith some content.');
    tick();
    expect(component.host.nativeElement.innerHTML).toContain('With some content.');
  }));

  it('should redirect on HTML failure', fakeAsync(() => {
    const testPage = 'testPage';
    activatedRouteStub.testParamMap = { pageName: testPage };
    createPagesComponent();

    const pageMatch = /^\.\/assets\/pages\/testPage\.md\?[0-9]*$/;
    const mockRequest = httpMock.expectOne(req => true);
    mockRequest.flush(null);
    expect(routerStub.routedUrl).toBeFalsy();
    tick();
    expect(routerStub.routedUrl).toBe('/');
  }));
});
