import { Component, OnInit } from '@angular/core';

import { ModalService } from './modal.service';

export interface ModalField {
  name: string;
  required: boolean;
  showAsTextArea?: boolean;
  placeholder?: string;
  value?: string;
}

export interface ModalDisplay {
  display(data: {
                  title: string,
                  description: string,
                  fields: ModalField[]
                },
              callback: (pressedOK: boolean, values: {}) => void
              ): void;
}

@Component({
  selector: 'app-drax-modal',
  templateUrl: './drax-modal.component.html',
  styleUrls: ['./drax-modal.component.scss']
})
export class DraxModalComponent implements OnInit, ModalDisplay {

  title = '';
  description = '';
  fields: ModalField[] = [];
  callback: (pressedOK: boolean, values: {}) => void = null;

  isVisible = false;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.modalService.registerComponent(this);
  }

  display(data: {
                  title: string,
                  description: string,
                  fields: ModalField[]
                },
          callback: (pressedOK: boolean, values: {}) => void
          ) {

    if (this.isVisible) {
      console.error('Calling display on visible modal.');
      return;
    }

    this.title = data.title;
    this.description = data.description;
    this.fields = data.fields;
    this.callback = callback;

    this.isVisible = true;

    return;
  }

  pressedOK() {
    this.isVisible = false;
    if (this.callback) {
      const values = {};
      for (const f of this.fields) {
        values[f.name] = f.value;
      }
      this.callback(true, values);
    }
  }

  pressedCancel() {

    this.isVisible = false;

    if (this.callback) {
      this.callback(false, []);
    }
  }

}
