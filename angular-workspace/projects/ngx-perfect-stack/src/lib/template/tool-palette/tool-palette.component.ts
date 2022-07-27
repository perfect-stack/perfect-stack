import {Component, OnInit} from '@angular/core';
import {
  ButtonGroupTool,
  ButtonTabsTool,
  ButtonTool,
  IconTool,
  ImageTool, LinkTool, MapTool,
  TextTool,
  ToolType
} from '../../domain/meta.page';

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
    modes: '',
    action: '',
    route: '/route/go/here'
  };

  static readonly buttonGroupPrototype: ButtonGroupTool = {
    type: ToolType.ButtonGroup,
    containerStyles: '',
    styles: 'btn btn-primary',
    label: 'Button1,Button2',
    modes: '',
    action: 'action1,action2',
    route: '/route/go/here1,/route/go/here2'
  };

  static readonly buttonTabsPrototype: ButtonTabsTool = {
    type: ToolType.ButtonTabs,
    containerStyles: '',
    styles: 'btn btn-secondary',
    label: '',
    modes: '',
    templateIndex: 0,
    template1: '',
    template2: '',
    template3: '',
    template4: '',
    template5: '',
    template6: '',
    template7: '',
  };

  static readonly imagePrototype: ImageTool = {
    type: ToolType.Image,
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    imageUrl: '/assets/images/image.png'
  }

  static readonly linkPrototype: LinkTool = {
    type: ToolType.Link,
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    action: '',
    route: '/route/go/here',
    text: 'Text'
  }

  static readonly mapPrototype: MapTool = {
    type: ToolType.Map,
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    easting: 'easting',
    northing: 'northing'
  }

  static readonly textPrototype: TextTool = {
    type: ToolType.TextTool,
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    text: 'Text'
  }

  static readonly iconPrototype: IconTool = {
    type: ToolType.Icon,
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    iconName: 'icon_name'
  }

  constructor() { }

  ngOnInit(): void {
  }

  get ToolPaletteComponent() {
    return ToolPaletteComponent;
  }
}
