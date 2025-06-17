import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
    selector: 'lib-tile-button-panel',
    templateUrl: './tile-button-panel.component.html',
    styleUrls: ['./tile-button-panel.component.scss'],
    standalone: false
})
export class TileButtonPanelComponent implements OnInit {

  @Input()
  buttonList: ButtonDefinition[];

  @Input()
  width: number = 0;

  @Input()
  selectionMode: 'single' | 'multiple' = 'single';

  @Output()
  buttonClicked = new EventEmitter<string[]>();

  selectedButtons: string[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  get rowCount() {
    if(this.buttonList?.length > 0 && this.width > 0) {
      return Math.ceil(this.buttonList.length / this.width);
    }
    else {
      return 0;
    }
  }

  isSelected(colIdx: number, rowIdx: number) {
    return this.selectedButtons.indexOf(this.getButton(colIdx, rowIdx).name) >= 0;
  }

  onButtonClicked(colIdx: number, rowIdx: number) {
    const selectedButtonName = this.getButton(colIdx, rowIdx).name;
    const idx = this.selectedButtons.indexOf(selectedButtonName);
    if(idx >= 0) {
      // remove it
      this.selectedButtons.splice(idx, 1);
    }
    else {
      // if multiple selections allowed add it
      if(this.selectionMode === 'multiple') {
        this.selectedButtons.push(selectedButtonName);
      }
      else {
        // if only a single selection the rest the array with one thing only
        this.selectedButtons = [selectedButtonName];
      }
    }

    this.buttonClicked.emit(this.selectedButtons);
  }

  doesButtonExist(colIdx: number, rowIdx: number) {
    return (rowIdx * this.width) + colIdx < this.buttonList.length;
  }

  getButton(colIdx: number, rowIdx: number): ButtonDefinition {
    const arrayIdx = (rowIdx * this.width) + colIdx;
    return this.buttonList[arrayIdx];
  }

  isEnabled(colIdx: number, rowIdx: number) {
    return this.getButton(colIdx, rowIdx).enabled;
  }
}

export interface ButtonDefinition {
  name: string;
  icon: string;
  enabled: boolean;
}
