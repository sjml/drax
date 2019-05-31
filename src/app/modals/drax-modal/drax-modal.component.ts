import { Component,
         OnInit,
         ComponentRef,
         ViewContainerRef,
         ViewChild,
         Injector,
         ComponentFactoryResolver,
         Type,
         Renderer2
       } from '@angular/core';

import { DataRequestModalComponent } from '../data-request-modal/data-request-modal.component';
import { FileHistoryModalComponent } from '../file-history-modal/file-history-modal.component';
import { FileMergeModalComponent } from '../file-merge-modal/file-merge-modal.component';

import { ModalService } from '../modal.service';

export interface DraxModalType {
  host: DraxModalComponent;
  display: (data: object) => void;
  onScroll?: (event: Event) => void;
}

@Component({
  selector: 'app-drax-modal',
  entryComponents: [
    DataRequestModalComponent,
    FileHistoryModalComponent,
    FileMergeModalComponent
  ],
  templateUrl: './drax-modal.component.html',
  styleUrls: ['./drax-modal.component.scss']
})
export class DraxModalComponent implements OnInit {

  childComponent: ComponentRef<DraxModalType> = null;
  @ViewChild('modalContent', { read: ViewContainerRef, static: true }) childContainer: ViewContainerRef;

  isVisible = false;

  constructor(
    private modalService: ModalService,
    private resolver: ComponentFactoryResolver,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.modalService.registerComponent(this);
  }

  generate(compType: Type<DraxModalType>, data: object) {
    // make the childview
    if (!data) { data = {}; }

    const inputProviders = Object.keys(data).map((keyName) => ({ provide: keyName, useValue: data[keyName] }) );
    const injector = Injector.create({providers: inputProviders});

    const factory = this.resolver.resolveComponentFactory(compType);
    const comp = factory.create(injector);
    this.childContainer.insert(comp.hostView);

    if (this.childComponent) {
      this.childComponent.destroy();
    }
    this.childComponent = comp;
    this.childComponent.instance.host = this;

    this.open(data);
  }

  open(data: object) {
    if (this.isVisible) {
      console.error('Calling open on already visible modal');
      return;
    }
    if (this.childComponent === null) {
      console.error('No child view to display in modal.');
      return;
    }

    this.childComponent.instance.display(data);

    this.isVisible = true;
    this.renderer.addClass(document.body, 'noscroll');
  }

  close() {
    if (!this.isVisible) {
      console.error('Calling close on already hidden modal.');
      return;
    }
    this.isVisible = false;
    this.renderer.removeClass(document.body, 'noscroll');
  }

  onScroll(event: Event) {
    if (this.childComponent !== null && this.childComponent.instance.onScroll !== undefined) {
      this.childComponent.instance.onScroll(event);
    }
  }
}
