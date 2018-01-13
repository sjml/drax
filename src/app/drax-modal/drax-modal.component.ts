import { Component,
         OnInit,
         ComponentRef,
         ViewContainerRef,
         ViewChild,
         ReflectiveInjector,
         ComponentFactoryResolver
       } from '@angular/core';

import { DataRequestModalComponent } from './data-request-modal.component';

import { ModalService } from './modal.service';

export interface DraxModalType {
  host: DraxModalComponent;
  caller: any;
  display: (data: object) => void;
}

@Component({
  selector: 'app-drax-modal',
  entryComponents: [DataRequestModalComponent],
  templateUrl: './drax-modal.component.html',
  styleUrls: ['./drax-modal.component.scss']
})
export class DraxModalComponent implements OnInit {

  childComponent: ComponentRef<DraxModalType> = null;
  @ViewChild('modalContent', { read: ViewContainerRef }) childContainer: ViewContainerRef;

  isVisible = false;

  constructor(
    private modalService: ModalService,
    private resolver: ComponentFactoryResolver
  ) {}

  ngOnInit() {
    this.modalService.registerComponent(this);
  }

  generate(data: object) {
    // make the childview
    if (!data) { data = {}; }

    const inputProviders = Object.keys(data).map((keyName) => ({ provide: keyName, useValue: data[keyName] }) );
    const resolvedInputs = ReflectiveInjector.resolve(inputProviders);

    const injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.childContainer.parentInjector);

    const factory = this.resolver.resolveComponentFactory(DataRequestModalComponent);
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
  }

  close() {
    if (!this.isVisible) {
      console.error('Calling close on already hidden modal.');
      return;
    }
    this.isVisible = false;
  }
}
