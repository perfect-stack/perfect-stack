import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'lib-radio-tile-button-panel',
  templateUrl: './radio-tile-button-panel.component.html',
  styleUrls: ['./radio-tile-button-panel.component.css']
})
export class RadioTileButtonPanelComponent implements OnInit {

  @Input()
  buttonList: string[];

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
    return this.getButtonName(colIdx, rowIdx) === this.selectedButton;
  }

  onButtonClicked(buttonName: string) {
    this.selectedButton = buttonName;
    this.buttonClicked.emit(buttonName);
  }

  doesButtonExist(colIdx: number, rowIdx: number) {
    return (rowIdx * this.width) + colIdx < this.buttonList.length;
  }

  getButtonName(colIdx: number, rowIdx: number) {
    const arrayIdx = (rowIdx * this.width) + colIdx;
    return this.buttonList[arrayIdx];
  }

}
