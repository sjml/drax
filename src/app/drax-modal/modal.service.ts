import { Injectable } from '@angular/core';

import { ModalDisplay, ModalField } from './drax-modal.component';

@Injectable()
export class ModalService {

  private modalDisplay: ModalDisplay = null;

  constructor() { }

  registerComponent(comp: ModalDisplay) {
    this.modalDisplay = comp;
  }

  display(data: {
                  title: string,
                  description: string,
                  fields: ModalField[]
                },
          callback: (pressedOK: boolean, values: {}) => void
        ) {

    if (this.modalDisplay) {
      this.modalDisplay.display(data, callback);
    }
  }

}
