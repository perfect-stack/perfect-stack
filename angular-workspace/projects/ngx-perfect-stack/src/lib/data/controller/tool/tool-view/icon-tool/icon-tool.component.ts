import {Component, Input, OnInit} from '@angular/core';
import {IconTool} from '../../../../../domain/meta.page';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {FormGroup} from '@angular/forms';
import {ToolPaletteComponent} from '../../../../../template/tool-palette/tool-palette.component';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {ExpressionService} from '../../../layout/controls/expression-control/expression.service';

@Component({
  selector: 'lib-icon-tool',
  templateUrl: './icon-tool.component.html',
  styleUrls: ['./icon-tool.component.css']
})
export class IconToolComponent implements OnInit {

  @Input()
  iconTool: IconTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  @Input()
  formGroup: FormGroup;

  iconValue: string;
  stylesValue: string;

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly expressionService: ExpressionService) { }

  ngOnInit(): void {
    if(this.formGroup) {
      this.iconValue = this.expressionService.evaluateFormGroup(this.iconTool.iconName, this.formGroup);
      this.stylesValue = this.expressionService.replaceSpaces(this.expressionService.evaluateFormGroup(this.iconTool.styles, this.formGroup), '-');
    }
    else if(this.ctx && this.ctx.dataMap) {
      this.iconValue = this.expressionService.evaluate(this.iconTool.iconName, this.ctx.dataMap);
      this.stylesValue = this.expressionService.replaceSpaces(this.expressionService.evaluate(this.iconTool.styles, this.ctx.dataMap), '-');
    }
  }

  onClick() {
    if(this.editorMode) {
      // trigger the PropertySheetService to start editing it
      this.propertySheetService.edit(this.iconTool);
    }
  }

  isDefaultIconName() {
    return this.iconTool.iconName === ToolPaletteComponent.iconPrototype.iconName;
  }
}
