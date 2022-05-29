import {Component, OnInit} from '@angular/core';
import {ButtonTool, ImageTool, ToolType} from '../../domain/meta.page';

@Component({
  selector: 'lib-tool-palette',
  templateUrl: './tool-palette.component.html',
  styleUrls: ['./tool-palette.component.css']
})
export class ToolPaletteComponent implements OnInit {

  buttonPrototype: ButtonTool = {
    type: ToolType.Button,
    styles: [],
    label: 'Button',
    route: '/route/go/here'
  };

  imagePrototype: ImageTool = {
    type: ToolType.Image,
    styles: [],
    imageUrl: '/assets/images/image.png'
  }

  constructor() { }

  ngOnInit(): void {
  }

}
