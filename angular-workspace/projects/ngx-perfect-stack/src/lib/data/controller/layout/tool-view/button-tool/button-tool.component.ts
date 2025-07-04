import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ButtonTool} from '../../../../../domain/meta.page';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {Router} from '@angular/router';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {ExpressionService} from '../../../layout/controls/expression-control/expression.service';
import {EventService} from '../../../../../event/event.service';

@Component({
    selector: 'lib-button-tool',
    templateUrl: './button-tool.component.html',
    styleUrls: ['./button-tool.component.css'],
    standalone: false
})
export class ButtonToolComponent implements OnInit {

  @Input()
  buttonTool: ButtonTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly expressionService: ExpressionService,
              protected readonly eventService: EventService,
              protected readonly router: Router) { }

  ngOnInit(): void {
  }

  onClick() {
    if(this.editorMode) {
      this.doEditorAction();
    }
    else {
      this.doApplicationAction();
    }
  }

  doEditorAction() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Button', this.buttonTool);
  }

  doApplicationAction() {
    if(this.buttonTool.action) {
      this.eventService.dispatchOnAction(this.ctx.metaPage.name, this.buttonTool.channel, this.ctx, this.buttonTool.action);
    }
    else if(this.buttonTool.route) {

      let route = this.buttonTool.route;

      console.log('route before evaluate()', route);
      route = this.expressionService.evaluate(route, this.ctx.dataMap);
      console.log('route after evaluate()', route);

      this.router.navigateByUrl(route);
    }
  }

}
