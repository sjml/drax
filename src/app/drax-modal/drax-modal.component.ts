import { Component, OnInit } from '@angular/core';

import { ModalService } from './modal.service';

export interface DraxModalType {
  host: DraxModalComponent;
  caller: any;
  display: (data: object) => void;
}

@Component({
  selector: 'app-drax-modal',
  templateUrl: './drax-modal.component.html',
  styleUrls: ['./drax-modal.component.scss']
})
export class DraxModalComponent implements OnInit {

  childView: DraxModalType = null;

  isVisible = false;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.modalService.registerComponent(this);
  }

  open(data: object) {
    if (this.isVisible) {
      console.error('Calling open on already visible modal');
      return;
    }
    if (this.childView === null) {
      console.error('No child view to display in modal.');
      return;
    }

    this.childView.display(data);

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
