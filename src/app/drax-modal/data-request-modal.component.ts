import { Component,
         AfterViewInit,
         ViewChildren,
         QueryList,
         ElementRef,
         HostListener
       } from '@angular/core';

import { DraxModalType, DraxModalComponent } from './drax-modal.component';

export interface ModalField {
  name: string;
  required: boolean;
  showAsTextArea?: boolean;
  placeholder?: string;
  value?: string;
}

@Component({
  selector: 'app-data-request-modal',
  templateUrl: './data-request-modal.component.html',
  styleUrls: ['./data-request-modal.component.scss']
})
export class DataRequestModalComponent implements AfterViewInit, DraxModalType {

  host: DraxModalComponent = null;

  @ViewChildren('modalField') displayFields: QueryList<ElementRef>;

  title = '';
  description = '';
  fields: ModalField[] = [];
  callback: (pressedOK: boolean, values: {}) => void = null;

  @HostListener('body:keypress', ['$event'])
  listenForEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.pressedCancel();
    }
  }

  constructor() {}

  ngAfterViewInit() {
    if (this.displayFields.length > 0) {
      setTimeout( () => {
        this.displayFields.first.nativeElement.focus();
      });
    }
  }

  display(data: {
            display: {
                      title: string,
                      description: string,
                      fields: ModalField[]
                    },
            callback: (pressedOK: boolean, values: {}) => void
          }) {

    this.title = data.display.title;
    this.description = data.display.description;
    this.fields = data.display.fields;
    this.callback = data.callback;

    return;
  }

  pressedOK() {
    if (this.callback) {
      const values = {};
      for (const f of this.fields) {
        values[f.name] = f.value;
      }
      this.callback(true, values);
    }
    this.host.close();
  }

  pressedCancel() {
    if (this.callback) {
      this.callback(false, []);
    }
    this.host.close();
  }
}
