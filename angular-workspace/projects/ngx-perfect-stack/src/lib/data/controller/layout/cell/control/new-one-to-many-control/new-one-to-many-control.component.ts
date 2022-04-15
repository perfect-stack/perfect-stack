import {Component, Input, OnInit} from '@angular/core';
import {CellAttribute} from '../../../../../../meta/page/meta-page-service/meta-page.service';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-new-one-to-many-control',
  templateUrl: './new-one-to-many-control.component.html',
  styleUrls: ['./new-one-to-many-control.component.css']
})
export class NewOneToManyControlComponent implements OnInit {

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
