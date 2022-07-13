import {Component, Input, OnInit} from '@angular/core';
import {ButtonGroupTool} from '../../../../../domain/meta.page';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {ExpressionService} from '../../../layout/controls/expression-control/expression.service';
import {EventService} from '../../../../../event/event.service';
import {Router} from '@angular/router';

@Component({
  selector: 'lib-button-group-tool',
  templateUrl: './button-group-tool.component.html',
  styleUrls: ['./button-group-tool.component.css']
})
export class ButtonGroupToolComponent implements OnInit {

  @Input()
  buttonGroupTool: ButtonGroupTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  actionNames: string[] = [];
  buttonNames: string[] = [];
  checkedName = '';

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly expressionService: ExpressionService,
              protected readonly eventService: EventService,
              protected readonly router: Router) { }

  ngOnInit(): void {
    this.actionNames = this.buttonGroupTool.action.split(',');
    this.buttonNames = this.buttonGroupTool.label.split(',');
    if(this.buttonNames.length > 0) {
      this.checkedName = this.buttonNames[0];
    }
  }

  onClick(buttonName: string) {
    this.checkedName = buttonName;
    if(this.editorMode) {
      this.doEditorAction();
    }
    else {
      this.doApplicationAction(buttonName);
    }
  }

  doEditorAction() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Button', this.buttonGroupTool);
  }

  doApplicationAction(buttonName: string) {
    if (this.buttonGroupTool.action) {
      const actionNameIdx = this.buttonNames.indexOf(buttonName);
      const actionName = this.actionNames[actionNameIdx];
      this.eventService.dispatchOnAction(this.ctx.metaPage.name, this.ctx, actionName);
    }
  }
}
