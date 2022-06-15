import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-event-dialog',
  templateUrl: './add-event-dialog.component.html',
  styleUrls: ['./add-event-dialog.component.scss']
})
export class AddEventDialogComponent implements OnInit {

  buttonList = [
    'Capture',
    'Sighting',
    'Audio',
    'Transmitter',
    'Electronic',
  ]

  eventType: string | null = null;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  onButtonClicked(eventType: string) {
    console.log(`Event type selected: ${eventType}`);
    this.eventType = eventType;
  }

  onContinue() {
    this.activeModal.close(this.eventType);
  }

  onCancel() {
    this.activeModal.dismiss();
  }
}
