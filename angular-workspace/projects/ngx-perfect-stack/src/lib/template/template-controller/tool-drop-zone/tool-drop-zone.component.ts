import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Template, TemplateLocationType, Tool} from '../../../domain/meta.page';
import {PropertyListMap, PropertySheetService} from '../../property-sheet/property-sheet.service';

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

  tool: Tool;

  constructor(protected propertySheetService: PropertySheetService) { }

  ngOnInit(): void {
    if(this.template && this.template.locations && this.templateLocationType) {
      this.tool = this.template.locations[this.templateLocationType];
    }
  }

  onDropEvent($event: any) {
    console.log('ToolDropZoneComponent.onDropEvent()', $event)
    if(!this.template) {
      throw new Error(`No template has been supplied for this drop zone`);
    }

    if(!this.templateLocationType) {
      throw new Error(`No templateLocation has been supplied for this drop zone`);
    }

    const toolPrototype = $event as Tool;
    if(toolPrototype) {
      this.tool = Object.assign({}, toolPrototype);

      const propertyList = PropertyListMap[this.tool.type];
      if(propertyList) {
        this.propertySheetService.edit(this.tool, propertyList);
      }
      else {
        throw new Error(`Unable to find property list for tool type of ${this.tool.type}`)
      }

      // just in time, create the map if needed
      if(!this.template.locations) {
        this.template.locations = {};
      }

      // now assign the tool to the locations map
      this.template.locations[this.templateLocationType] = this.tool;
    }
  }
}
