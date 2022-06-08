import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {TextTool} from '../../../../../domain/meta.page';
import {ExpressionService} from '../../../layout/controls/expression-control/expression.service';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-text-tool',
  templateUrl: './text-tool.component.html',
  styleUrls: ['./text-tool.component.css']
})
export class TextToolComponent implements OnInit {

  @Input()
  textTool: TextTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  @Input()
  formGroup: FormGroup;

  textValue: string
  stylesValue: string;

  constructor(protected readonly expressionService: ExpressionService) { }

  ngOnInit(): void {
    if(this.formGroup) {
      this.textValue = this.expressionService.evaluateFormGroup(this.textTool.text, this.formGroup);
      this.stylesValue = this.expressionService.replaceSpaces(this.expressionService.evaluateFormGroup(this.textTool.styles, this.formGroup), '-');
    }
    else if(this.ctx && this.ctx.dataMap) {
      this.textValue = this.expressionService.evaluate(this.textTool.text, this.ctx.dataMap);
      this.stylesValue = this.expressionService.replaceSpaces(this.expressionService.evaluate(this.textTool.styles, this.ctx.dataMap), '-');
    }
  }

}
