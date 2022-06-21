import {Component, OnInit} from '@angular/core';
import {ButtonTool, IconTool, ImageTool, TextTool, ToolType} from '../../domain/meta.page';

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
    action: '',
    route: '/route/go/here'
  };

  static readonly imagePrototype: ImageTool = {
    type: ToolType.Image,
    containerStyles: '',
    styles: '',
    label: '',
    imageUrl: '/assets/images/image.png'
  }

  static readonly textPrototype: TextTool = {
    type: ToolType.TextTool,
    containerStyles: '',
    styles: '',
    label: '',
    text: 'Text'
  }

  static readonly iconPrototype: IconTool = {
    type: ToolType.Icon,
    containerStyles: '',
    styles: '',
    label: '',
    iconName: 'icon_name'
  }

  constructor() { }

  ngOnInit(): void {
  }

  get ToolPaletteComponent() {
    return ToolPaletteComponent;
  }
}
