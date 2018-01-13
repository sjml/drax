import { Injectable } from '@angular/core';

import { DraxModalComponent, DraxModalType } from './drax-modal.component';

@Injectable()
export class ModalService {

  private comp: DraxModalComponent = null;

  constructor() { }

  registerComponent(comp: DraxModalComponent) {
    this.comp = comp;
  }

  generate(data: object) {
    if (this.comp === null) {
      console.error('No component for hosting.');
      return;
    }
    this.comp.generate(data);
  }

}
