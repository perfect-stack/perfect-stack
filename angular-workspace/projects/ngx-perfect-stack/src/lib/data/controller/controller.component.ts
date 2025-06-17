import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../data-edit/form-service/form.service';
import {Template} from '../../domain/meta.page';
import {DebugService} from "../../utils/debug/debug.service";

@Component({
    selector: 'lib-controller',
    templateUrl: './controller.component.html',
    styleUrls: ['./controller.component.css'],
    standalone: false
})
export class ControllerComponent implements OnInit {

  @Input()
  ctx: FormContext;

  @Input()
  template: Template;

  @Input()
  showTemplateHeadings = true;

  constructor(protected readonly debugService: DebugService) { }

  ngOnInit(): void {
  }
}
