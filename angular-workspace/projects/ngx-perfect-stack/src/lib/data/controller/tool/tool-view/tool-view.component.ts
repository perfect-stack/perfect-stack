import {Component, Input, OnInit} from '@angular/core';
import {ButtonGroupTool, ButtonTool, IconTool, ImageTool, TextTool, Tool} from '../../../../domain/meta.page';
import {FormContext} from '../../../data-edit/form-service/form.service';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-tool-view',
  templateUrl: './tool-view.component.html',
  styleUrls: ['./tool-view.component.css']
})
export class ToolViewComponent implements OnInit {

  @Input()
  tool: Tool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  @Input()
  formGroup: FormGroup;

  constructor() { }

  ngOnInit(): void {
  }

  asButtonTool() {
    return this.tool as ButtonTool;
  }

  asButtonGroupTool() {
    return this.tool as ButtonGroupTool;
  }

  asImageTool() {
    return this.tool as ImageTool;
  }

  asTextTool() {
    return this.tool as TextTool;
  }

  asIconTool() {
    return this.tool as IconTool;
  }
}
