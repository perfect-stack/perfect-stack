import {Component, OnInit} from '@angular/core';
import {
  ButtonGroupTool,
  ButtonTabsTool,
  ButtonTool,
  IconTool,
  ImageTool,
  LastSignInTool,
  LinkTool,
  MapTool,
  PageTitleTool,
  PaginateTool,
  TabTool,
  TextTool,
  ToolType
} from '../../domain/meta.page';
import {ActionType} from '../../domain/meta.role';

@Component({
    selector: 'lib-tool-palette',
    templateUrl: './tool-palette.component.html',
    styleUrls: ['./tool-palette.component.css'],
    standalone: false
})
export class ToolPaletteComponent implements OnInit {

  static readonly buttonPrototype: ButtonTool = {
    type: ToolType.Button,
    channel: '',
    containerStyles: '',
    styles: 'btn btn-primary',
    label: 'Button',
    modes: '',
    action: '',
    route: '/route/go/here',
    icon: '',
    actionPermit: ActionType.Read,
    subjectPermit: ''
  };

  static readonly buttonGroupPrototype: ButtonGroupTool = {
    type: ToolType.ButtonGroup,
    channel: '',
    containerStyles: '',
    styles: 'btn btn-primary',
    label: 'Button1,Button2',
    modes: '',
    action: 'action1,action2',
    route: '/route/go/here1,/route/go/here2'
  };

  static readonly buttonTabsPrototype: ButtonTabsTool = {
    type: ToolType.ButtonTabs,
    channel: '',
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
    channel: '',
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    imageUrl: '/assets/images/image.png'
  }

  static readonly lastSignInPrototype: LastSignInTool = {
    type: ToolType.LastSignIn,
    channel: '',
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    username: 'email_address'
  }

  static readonly linkPrototype: LinkTool = {
    type: ToolType.Link,
    channel: '',
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
    channel: '',
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    easting: 'easting',
    northing: 'northing'
  }

  static readonly pageTitlePrototype: PageTitleTool = {
    type: ToolType.PageTitle,
    channel: '',
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    nameAttributes: ''
  }

  static readonly paginatePrototype: PaginateTool = {
    type: ToolType.Paginate,
    channel: '',
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    criteriaForm: ''
  }

  static readonly tabPrototype: TabTool = {
    type: ToolType.TabTool,
    channel: '',
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    template1: '',
    template2: '',
    template3: '',
    template4: '',
    template5: '',
    template6: '',
    template7: '',
  }

  static readonly textPrototype: TextTool = {
    type: ToolType.TextTool,
    channel: '',
    containerStyles: '',
    styles: '',
    label: '',
    modes: '',
    text: 'Text'
  }

  static readonly iconPrototype: IconTool = {
    type: ToolType.Icon,
    channel: '',
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
