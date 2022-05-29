import {Component, OnInit} from '@angular/core';
import {ButtonTool, ImageTool, ToolType} from '../../domain/meta.page';

@Component({
  selector: 'lib-tool-palette',
  templateUrl: './tool-palette.component.html',
  styleUrls: ['./tool-palette.component.css']
})
export class ToolPaletteComponent implements OnInit {

  static readonly buttonPrototype: ButtonTool = {
    type: ToolType.Button,
    containerStyles: '',
    styles: 'btn btn-primary',
    label: 'Button',
    route: '/route/go/here'
  };

  static readonly imagePrototype: ImageTool = {
    type: ToolType.Image,
    containerStyles: '',
    styles: '',
    imageUrl: '/assets/images/image.png'
  }

  constructor() { }

  ngOnInit(): void {
  }

  get ToolPaletteComponent() {
    return ToolPaletteComponent;
  }
}
