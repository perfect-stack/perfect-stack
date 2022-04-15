import {Component, Input, OnInit} from '@angular/core';
import {CellAttribute} from '../../../../meta/page/meta-page-service/meta-page.service';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.css']
})
export class CellComponent implements OnInit {

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
