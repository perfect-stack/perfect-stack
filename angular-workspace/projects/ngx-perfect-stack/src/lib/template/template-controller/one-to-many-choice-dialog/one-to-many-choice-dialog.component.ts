import { Component, OnInit } from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ButtonDefinition} from '../../../utils/tile-button-panel/tile-button-panel.component';

@Component({
  selector: 'lib-one-to-many-choice-dialog',
  templateUrl: './one-to-many-choice-dialog.component.html',
  styleUrls: ['./one-to-many-choice-dialog.component.css']
})
export class OneToManyChoiceDialogComponent implements OnInit {

  buttonList: ButtonDefinition[] = [
    {name: 'Table', icon: 'table', enabled: true},
    {name: 'Links', icon: 'link', enabled: true},
    {name: 'Media', icon: 'image', enabled: true},
  ]

  controlType: string | null = null;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  onButtonClicked(itemsSelected: string[]) {
    console.log(`Event type selected: ${itemsSelected[0]}`);
    this.controlType = itemsSelected[0];
  }

  onContinue() {
    this.activeModal.close(this.controlType);
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  isContinueEnabled() {
    return this.controlType !== null;
  }

}
