import {Component, Input, OnInit} from '@angular/core';
import {ButtonTool} from '../../../../../domain/meta.page';

@Component({
  selector: 'lib-button-tool',
  templateUrl: './button-tool.component.html',
  styleUrls: ['./button-tool.component.css']
})
export class ButtonToolComponent implements OnInit {

  @Input()
  buttonTool: ButtonTool;

  constructor() { }

  ngOnInit(): void {
  }

}
