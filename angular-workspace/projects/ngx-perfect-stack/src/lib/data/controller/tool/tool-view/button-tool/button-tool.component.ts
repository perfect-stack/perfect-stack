import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ButtonTool} from '../../../../../domain/meta.page';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {Router} from '@angular/router';

@Component({
  selector: 'lib-button-tool',
  templateUrl: './button-tool.component.html',
  styleUrls: ['./button-tool.component.css']
})
export class ButtonToolComponent implements OnInit {

  @Input()
  buttonTool: ButtonTool;

  @Input()
  editorMode = false;

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly router: Router) { }

  ngOnInit(): void {
  }

  onClick() {
    if(this.editorMode) {
      // trigger the PropertySheetService to start editing it
      this.propertySheetService.edit(this.buttonTool);
    }
    else {
      this.doAction();
    }
  }

  doAction() {
    console.log('doAction()');
    if(this.buttonTool.route) {
      this.router.navigate([this.buttonTool.route]);
    }
  }

}
