import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import {
  ButtonGroupTool,
  ButtonTabsTool,
  ButtonTool,
  DurationTool,
  IconTool,
  ImageTool,
  LastSignInTool,
  LinkTool,
  MapTool,
  PageTitleTool,
  PaginateTool,
  TabTool,
  TextTool,
  Tool,
  TreeTool
} from '../../../../domain/meta.page';
import { FormContext } from '../../../data-edit/form-service/form.service';

@Component({
  selector: 'lib-tool-view',
  templateUrl: './tool-view.component.html',
  styleUrls: ['./tool-view.component.css'],
  standalone: false
})
export class ToolViewComponent implements OnInit {

  @Input()
  tool: Tool | undefined;

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

  asDurationTool() {
    return this.tool as DurationTool;
  }

  asImageTool() {
    return this.tool as ImageTool;
  }

  asLastSignInTool() {
    return this.tool as LastSignInTool;
  }

  asLinkTool() {
    return this.tool as LinkTool;
  }

  asMapTool() {
    return this.tool as MapTool;
  }

  asPageTitleTool() {
    return this.tool as PageTitleTool;
  }

  asPaginateTool() {
    return this.tool as PaginateTool;
  }

  asTabTool() {
    return this.tool as TabTool;
  }

  asTextTool() {
    return this.tool as TextTool;
  }

  asIconTool() {
    return this.tool as IconTool;
  }

  asTreeTool() {
    return this.tool as TreeTool;
  }

  isToolVisible() {
    if (!this.tool) return false;
    const modes = this.tool.modes;
    if(modes && this.ctx && this.ctx.mode) {
      return modes.indexOf(this.ctx.mode) >= 0;
    }
    else {
      // If no list of modes is defined then the tool is always visible
      return true;
    }
  }

}
