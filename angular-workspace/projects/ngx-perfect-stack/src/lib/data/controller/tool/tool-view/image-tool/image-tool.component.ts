import {Component, Input, OnInit} from '@angular/core';
import {ImageTool} from '../../../../../domain/meta.page';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {ToolPaletteComponent} from '../../../../../template/tool-palette/tool-palette.component';
import {FormContext} from '../../../../data-edit/form-service/form.service';

@Component({
  selector: 'lib-image-tool',
  templateUrl: './image-tool.component.html',
  styleUrls: ['./image-tool.component.css']
})
export class ImageToolComponent implements OnInit {

  @Input()
  imageTool: ImageTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  constructor(protected readonly propertySheetService: PropertySheetService) { }

  ngOnInit(): void {
  }

  onClick() {
    if(this.editorMode) {
      // trigger the PropertySheetService to start editing it
      this.propertySheetService.edit(this.imageTool);
    }
  }

  isDefaultImageUrl() {
    return this.imageTool.imageUrl === ToolPaletteComponent.imagePrototype.imageUrl;
  }

}
