import { Component,
         AfterViewInit,
         ViewChildren,
         QueryList,
         ElementRef
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
  caller: any = null;

  @ViewChildren('modalField') displayFields: QueryList<ElementRef>;

  title = '';
  description = '';
  fields: ModalField[] = [];
  callback: (pressedOK: boolean, values: {}) => void = null;

  constructor() {}

  ngAfterViewInit() {
    this.displayFields.changes.subscribe(_ => {
      if (this.displayFields.length > 0) {
        this.displayFields.first.nativeElement.focus();
      }
    });
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
