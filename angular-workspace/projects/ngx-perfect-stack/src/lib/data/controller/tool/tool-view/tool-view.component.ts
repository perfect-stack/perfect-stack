import {Component, Input, OnInit} from '@angular/core';
import {ButtonTool, ImageTool, Tool} from '../../../../domain/meta.page';
import {FormContext} from '../../../data-edit/form-service/form.service';

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

  constructor() { }

  ngOnInit(): void {
  }

  asButtonTool() {
    return this.tool as ButtonTool;
  }

  asImageTool() {
    return this.tool as ImageTool;
  }

}
