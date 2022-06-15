import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'lib-radio-tile-button-panel',
  templateUrl: './radio-tile-button-panel.component.html',
  styleUrls: ['./radio-tile-button-panel.component.css']
})
export class RadioTileButtonPanelComponent implements OnInit {

  @Input()
  buttonList: ButtonDefinition[];

  @Input()
  width: number = 0;

  @Output()
  buttonClicked = new EventEmitter<string>();

  selectedButton: string | null = null;

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
    return this.getButton(colIdx, rowIdx).name === this.selectedButton;
  }

  onButtonClicked(colIdx: number, rowIdx: number) {
    this.selectedButton = this.getButton(colIdx, rowIdx).name;
    this.buttonClicked.emit(this.selectedButton);
  }

  doesButtonExist(colIdx: number, rowIdx: number) {
    return (rowIdx * this.width) + colIdx < this.buttonList.length;
  }

  getButton(colIdx: number, rowIdx: number): ButtonDefinition {
    const arrayIdx = (rowIdx * this.width) + colIdx;
    return this.buttonList[arrayIdx];
  }
}

export interface ButtonDefinition {
  name: string;
  icon: string;
}
