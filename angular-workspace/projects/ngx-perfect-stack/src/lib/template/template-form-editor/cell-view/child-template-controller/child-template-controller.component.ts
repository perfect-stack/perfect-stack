import {Component, Input, OnInit} from '@angular/core';
import {Template} from '../../../../domain/meta.page';

@Component({
  selector: 'lib-child-template-controller',
  templateUrl: './child-template-controller.component.html',
  styleUrls: ['./child-template-controller.component.css']
})
export class ChildTemplateControllerComponent implements OnInit {

  @Input()
  template: Template;

  constructor() {
  }

  ngOnInit(): void {
  }

}
