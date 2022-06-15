import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  ButtonDefinition
} from '../../../../../ngx-perfect-stack/src/lib/utils/radio-tile-button-panel/radio-tile-button-panel.component';

@Component({
  selector: 'app-add-event-dialog',
  templateUrl: './add-event-dialog.component.html',
  styleUrls: ['./add-event-dialog.component.scss']
})
export class AddEventDialogComponent implements OnInit {

  buttonList: ButtonDefinition[] = [
    {name: 'Capture', icon: 'back_hand'},
    {name: 'Sighting', icon: 'visibility'},
    {name: 'Audio', icon: 'hearing'},
    {name: 'Transmitter', icon: 'sensors'},
    {name: 'Electronic', icon: 'monitor_heart'},
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

  isContinueEnabled() {
    return this.eventType !== null;
  }
}
