import {Component, Input, OnInit} from '@angular/core';
import {CellAttribute} from '../../../../meta/page/meta-page-service/meta-page.service';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'app-cell-container',
  templateUrl: './cell-container.component.html',
  styleUrls: ['./cell-container.component.css']
})
export class CellContainerComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: FormGroup;

  constructor() { }

  ngOnInit(): void {
  }

}
