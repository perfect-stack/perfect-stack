import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ButtonTool} from '../../../../../domain/meta.page';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {Router} from '@angular/router';
import {FormContext} from '../../../../data-edit/form-service/form.service';

@Component({
  selector: 'lib-button-tool',
  templateUrl: './button-tool.component.html',
  styleUrls: ['./button-tool.component.css']
})
export class ButtonToolComponent implements OnInit {

  @Input()
  buttonTool: ButtonTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  constructor(protected readonly propertySheetService: PropertySheetService,
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
    this.propertySheetService.edit(this.buttonTool);
  }

  doApplicationAction() {
    console.log('doAction()');
    if(this.buttonTool.route) {

      let route = this.buttonTool.route;

      // TODO: just for now we're going to hack out the Bird Id for "Edit Bird" button, but need to come back and fix this later
      console.log('route = ', route);
      console.log('ctx', this.ctx);
      if(this.ctx && route.indexOf('${bird.id}') >= 0) {
        const birdData = this.ctx.dataMap.get('bird');
        console.log('got birdData', birdData);
        if(birdData) {
          const id = birdData.result.id;
          console.log('got id', id);
          if(id) {
            route = route.replace('${bird.id}', id);
            console.log('route is now', route);
          }
        }
      }

      this.router.navigate([route]);
    }
  }

}
