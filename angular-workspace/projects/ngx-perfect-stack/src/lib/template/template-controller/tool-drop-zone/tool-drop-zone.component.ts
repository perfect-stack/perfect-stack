import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Template, TemplateLocationType, Tool} from '../../../domain/meta.page';

@Component({
  selector: 'lib-tool-drop-zone',
  templateUrl: './tool-drop-zone.component.html',
  styleUrls: ['./tool-drop-zone.component.css']
})
export class ToolDropZoneComponent implements OnInit {

  @Input()
  template: Template;

  @Input()
  templateLocationType: TemplateLocationType

  @Input()
  tool: Tool;

  @Output()
  toolComponentChange = new EventEmitter<Tool>();

  constructor() { }

  ngOnInit(): void {
  }

  onDropEvent($event: any) {
    console.log('ToolDropZoneComponent.onDropEvent()', $event)
    const toolPrototype = $event as Tool;
    this.tool = Object.assign({}, toolPrototype);
  }
}
