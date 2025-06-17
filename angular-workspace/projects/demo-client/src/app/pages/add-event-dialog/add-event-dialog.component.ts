import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  ButtonDefinition
} from '../../../../../ngx-perfect-stack/src/lib/utils/tile-button-panel/tile-button-panel.component';

@Component({
    selector: 'app-add-event-dialog',
    templateUrl: './add-event-dialog.component.html',
    styleUrls: ['./add-event-dialog.component.scss'],
    standalone: false
})
export class AddEventDialogComponent implements OnInit {

  buttonList: ButtonDefinition[] = [
    {name: 'Capture', icon: 'back_hand', enabled: true},
    {name: 'Sighting', icon: 'visibility', enabled: true},
    {name: 'Audio', icon: 'hearing', enabled: true},
    {name: 'Transmitter', icon: 'sensors', enabled: true},
    {name: 'Electronic', icon: 'monitor_heart', enabled: true},
  ]

  eventType: string | null = null;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  onButtonClicked(itemsSelected: string[]) {
    console.log(`Event type selected: ${itemsSelected[0]}`);
    this.eventType = itemsSelected[0];
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
