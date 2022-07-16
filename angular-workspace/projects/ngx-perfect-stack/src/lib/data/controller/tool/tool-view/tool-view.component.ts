import {Component, Input, OnInit} from '@angular/core';
import {
  ButtonGroupTool,
  ButtonTabsTool,
  ButtonTool,
  IconTool,
  ImageTool, MapTool,
  TextTool,
  Tool
} from '../../../../domain/meta.page';
import {FormContext} from '../../../data-edit/form-service/form.service';
import {UntypedFormGroup} from '@angular/forms';

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
  formGroup: UntypedFormGroup;

  constructor() { }

  ngOnInit(): void {
  }

  asButtonTool() {
    return this.tool as ButtonTool;
  }

  asButtonGroupTool() {
    return this.tool as ButtonGroupTool;
  }

  asButtonTabsTool() {
    return this.tool as ButtonTabsTool;
  }

  asImageTool() {
    return this.tool as ImageTool;
  }

  asMapTool() {
    return this.tool as MapTool;
  }

  asTextTool() {
    return this.tool as TextTool;
  }

  asIconTool() {
    return this.tool as IconTool;
  }

}
