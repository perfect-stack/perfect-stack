import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'lib-colour-band-dialog',
  templateUrl: './colour-band-dialog.component.html',
  styleUrls: ['./colour-band-dialog.component.css']
})
export class ColourBandDialogComponent implements OnInit {

  colourList = [
    "Black",
    "Grey",
    "White",
    "Red",
    "Orange",
    "Yellow",
    "Pale Pink",
    "Pink",
    "Hot Pink",
    "Crimson",
    "Mauve",
    "Purple",
    "Violet",
    "Aqua",
    "Light Blue",
    "Pale Blue",
    "Medium Blue",
    "Dark Blue",
    "Fluoro Green",
    "Pale Green",
    "Lime Green",
    "Green",
    "Dark Green",
    "Brown",
    "Striped"
  ];

  public colourBand = "";

  firstColour: string = "";
  identifier: string = "";
  secondColour: string = "";

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit(): void {
    console.log('ColourBandDialogComponent.ngOnInit: ' + this.colourBand);

    if(this.colourBand) {
      const tokens = this.colourBand.trim().split(/\s+/).filter(Boolean);
      console.log('tokens = ', tokens);

      const onIndex = tokens.indexOf('on');
      if(onIndex >= 0) {
        this.firstColour = (0 < tokens.length) ? tokens[0] : '';
        this.identifier = (onIndex - 1) < tokens.length ? tokens[onIndex - 1] : '';
        this.secondColour = (onIndex + 1 < tokens.length) ? tokens[onIndex + 1] : '';
      }
      else {
        this.firstColour = (0 < tokens.length) ? tokens[0] : '';
        this.identifier = (1 < tokens.length) ? tokens[1] : '';
        this.secondColour = (2 < tokens.length) ? tokens[2] : '';
      }
    }
  }


  onSelectFirstColour(colour: string) {
    this.firstColour = colour;
  }

  onSelectSecondColour(colour: string) {
    this.secondColour = colour;
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  onAdd() {
    const value = `${this.firstColour} ${this.identifier.toUpperCase()} on ${this.secondColour}`.trim();
    this.activeModal.close(value);
  }

  isAddEnabled() {
    return true;
  }
}
