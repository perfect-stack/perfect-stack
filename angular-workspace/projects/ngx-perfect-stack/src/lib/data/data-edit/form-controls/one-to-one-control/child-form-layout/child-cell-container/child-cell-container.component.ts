import {Component, Input, OnInit} from '@angular/core';
import {CellAttribute} from '../../../../../../meta/page/meta-page-service/meta-page.service';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-child-cell-container',
  templateUrl: './child-cell-container.component.html',
  styleUrls: ['./child-cell-container.component.css']
})
export class ChildCellContainerComponent implements OnInit {

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
