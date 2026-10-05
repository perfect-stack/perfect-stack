import { Component, Input, OnInit } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { ButtonGroupTool, ButtonTabsTool, MetaPage, Template, ToolType } from '../../../../../domain/meta.page';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { PropertySheetService } from '../../../../../template/property-sheet/property-sheet.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { EventService } from '../../../../../event/event.service';

export class ButtonTabContext {
  buttonGroupTool = new ButtonGroupTool();
  tabMap = new Map<string, MetaPage>();
}

@Component({
  selector: 'lib-button-tabs-tool',
  templateUrl: './button-tabs-tool.component.html',
  styleUrls: ['./button-tabs-tool.component.css'],
  standalone: false
})
export class ButtonTabsToolComponent implements OnInit {

  @Input()
  buttonTabsTool: ButtonTabsTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  tabContext$: Observable<ButtonTabContext>;
  selectedTemplate: Template;

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly metaPageService: MetaPageService,
              protected readonly eventService: EventService,) { }

  ngOnInit(): void {
    this.tabContext$ = this.metaPageService.metaPageMap$.pipe(switchMap((metaPageMap) => {

      const tabContext = new ButtonTabContext();
      const tabNames: string[] = [];

      let pageNames = this.extractNames(
        this.buttonTabsTool.template1,
        this.buttonTabsTool.template2,
        this.buttonTabsTool.template3,
        this.buttonTabsTool.template4,
        this.buttonTabsTool.template5,
        this.buttonTabsTool.template6,
        this.buttonTabsTool.template7,
      );

      if(pageNames.length > 0) {
        for(const nextPageName of pageNames) {
          const metaPage = metaPageMap.get(nextPageName);
          if(metaPage) {
            tabNames.push(metaPage.title);
            tabContext.tabMap.set(metaPage.title, metaPage);
          }
        }
      }
      else {
        tabNames.push('Undefined');
      }

      const buttonGroupTool = tabContext.buttonGroupTool;
      buttonGroupTool.type = ToolType.ButtonGroup;
      buttonGroupTool.containerStyles = this.buttonTabsTool.containerStyles;
      buttonGroupTool.styles = this.buttonTabsTool.styles;
      buttonGroupTool.label = tabNames.join(',');
      buttonGroupTool.action = tabNames.join(',');

      // find out which tab has data and which tabs do not
      let initialTab = 0;
      const dataMap = this.ctx.dataMap;
      const eventResult = dataMap.get("event");
      if(eventResult) {
        const event = eventResult.result;
        console.log(' - event:', event);
        if(event) {
          const hasEventCoordinates = event['easting'] && event['northing'];
          const hasLocation = event['location'];

          console.log(' - hasEventCoordinates:', hasEventCoordinates);
          console.log(' - hasLocation:', hasLocation);

          if(hasLocation) {
            initialTab = 1;
          }
        }
      }

      // set the initial tab
      console.log(`Set initial tab = ${tabNames[initialTab]}`);
      this.onTabSelected(tabNames[initialTab], tabContext);

      return of(tabContext);
    }));
  }

  extractNames(...names: string[]) {
    return names.filter(s => s !== null && s.length > 0);
  }

  onClick(buttonName: string) {
    if(this.editorMode) {
      this.doEditorAction();
    }
    else {
      this.doApplicationAction(buttonName);
    }
  }

  doEditorAction() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Button Tabs', this.buttonTabsTool);
  }

  doApplicationAction(buttonName: string) {
  }

  onTabSelected(tabName: string, tabContext: ButtonTabContext) {
    console.log(`Button Tab selected: ${tabName}, templateIndex = ${this.buttonTabsTool.templateIndex}.`);
    const tabMetaPage = tabContext.tabMap.get(tabName);
    if(tabMetaPage) {
      console.log(`Button Tab metaPage = ${tabMetaPage.name}`);
      this.selectedTemplate = tabMetaPage.templates[0];
    }
  }
}
