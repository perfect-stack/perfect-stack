import {Component, Input, OnInit} from '@angular/core';
import {CellAttribute} from '../../../meta/page/meta-page-service/meta-page.service';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cells: CellAttribute[][];

  @Input()
  entityForm: FormGroup;

  constructor() { }

  ngOnInit(): void {
  }

}
