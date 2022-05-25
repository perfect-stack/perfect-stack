import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../data-edit/form-service/form.service';
import {Template} from '../../domain/meta.page';

@Component({
  selector: 'lib-controller',
  templateUrl: './controller.component.html',
  styleUrls: ['./controller.component.css']
})
export class ControllerComponent implements OnInit {

  @Input()
  ctx: FormContext;

  @Input()
  template: Template;

  @Input()
  showTemplateHeadings = true;

  constructor() { }

  ngOnInit(): void {
  }
}
