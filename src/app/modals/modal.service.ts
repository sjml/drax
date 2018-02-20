import { Injectable, Type } from '@angular/core';

import { DraxModalComponent, DraxModalType } from './drax-modal/drax-modal.component';

@Injectable()
export class ModalService {

  private comp: DraxModalComponent = null;

  constructor() { }

  registerComponent(comp: DraxModalComponent) {
    this.comp = comp;
  }

  generate(compType: Type<DraxModalType>, data: object) {
    if (this.comp === null) {
      console.error('No component for hosting.');
      return;
    }
    this.comp.generate(compType, data);
  }

}
