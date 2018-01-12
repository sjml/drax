import { Component,
         OnInit,
         AfterViewInit,
         ViewChildren,
         QueryList,
         ElementRef
        } from '@angular/core';

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
export class DraxModalComponent implements OnInit, AfterViewInit, ModalDisplay {

  @ViewChildren('modalField') displayFields: QueryList<ElementRef>;

  title = '';
  description = '';
  fields: ModalField[] = [];
  callback: (pressedOK: boolean, values: {}) => void = null;

  isVisible = false;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.modalService.registerComponent(this);
  }

  ngAfterViewInit() {
    this.displayFields.changes.subscribe(_ => {
      if (this.displayFields.length > 0) {
        this.displayFields.first.nativeElement.focus();
      }
    });
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

    if (this.fields.length > 0) {
      this.fields[0]['focused'] = true;
    }

    this.isVisible = true;

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
    this.isVisible = false;
  }

  pressedCancel() {
    if (this.callback) {
      this.callback(false, []);
    }
    this.isVisible = false;
  }

}
