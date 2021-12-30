import {Component, Input, OnInit} from '@angular/core';
import {Template, TemplateType} from '../../domain/meta.page';

@Component({
  selector: 'app-template-controller',
  templateUrl: './template-controller.component.html',
  styleUrls: ['./template-controller.component.css']
})
export class TemplateControllerComponent implements OnInit {

  @Input()
  template: Template;

  constructor() { }

  ngOnInit(): void {
  }

  getTemplateTypeOptions() {
    return Object.keys(TemplateType);
  }
}
