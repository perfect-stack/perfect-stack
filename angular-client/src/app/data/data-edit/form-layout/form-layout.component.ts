import {Component, Input, OnInit} from '@angular/core';
import {Cell} from '../../../domain/meta.page';
import {FormContext} from '../form-service/form.service';

@Component({
  selector: 'app-form-layout',
  templateUrl: './form-layout.component.html',
  styleUrls: ['./form-layout.component.css']
})
export class FormLayoutComponent implements OnInit {

  @Input()
  ctx: FormContext;

  constructor() { }

  ngOnInit(): void {
  }

  getCSS(cell: Cell): string[] {
    return [
      `col-${cell.width}`
    ];
  }
}
