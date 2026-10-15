import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { UntypedFormGroup } from '@angular/forms';
import { MetaPage, TabTool, Template } from '../../../../../domain/meta.page';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { PropertySheetService } from '../../../../../template/property-sheet/property-sheet.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';

export class TabToolContext {
  tabList: MetaPage[] = [];
}

@Component({
  selector: 'lib-tab-tool',
  templateUrl: './tab-tool.component.html',
  styleUrls: ['./tab-tool.component.scss'],
  standalone: false
})
export class TabToolComponent implements OnInit, OnChanges {

  private static tabStateMap = new Map<string, string>();

  @Input()
  tabTool: TabTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  @Input()
  mode: string | null = null;

  @Input()
  formGroup?: UntypedFormGroup;

  tabContext$: Observable<TabToolContext>;
  selectedMetaPage: MetaPage;
  selectedTemplate: Template;
  selectedTabIdx: number;

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly metaPageService: MetaPageService) { }

  ngOnInit(): void {
    this.initTabContext();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tabTool'] || changes['ctx']) {
      this.initTabContext();
    }
  }

  private getTabKey(): string {
    const pageName = this.ctx?.metaPage?.name || this.ctx?.metaName || '';
    const toolId = this.tabTool?.template1 || '';
    return `${pageName}:${toolId}`;
  }

  private initTabContext(): void {
    if (!this.tabTool) {
      return;
    }
    this.tabContext$ = this.metaPageService.metaPageMap$.pipe(switchMap((metaPageMap) => {

      const tabContext = new TabToolContext();

      let pageNames = this.extractNames(
        this.tabTool.template1,
        this.tabTool.template2,
        this.tabTool.template3,
        this.tabTool.template4,
        this.tabTool.template5,
        this.tabTool.template6,
        this.tabTool.template7,
      );

      if(pageNames.length > 0) {
        for(const nextPageName of pageNames) {
          const metaPage = metaPageMap.get(nextPageName);
          if(metaPage) {
            tabContext.tabList.push(metaPage);
          }
          else {
            console.warn(`Unable to find MetaPage for Tab template of ${nextPageName}`);
          }
        }
      }

      // set the initial or preserved tab
      if(tabContext.tabList.length > 0) {
        const key = this.getTabKey();
        const savedTabName = key ? TabToolComponent.tabStateMap.get(key) : null;
        let targetIdx = 0;

        if (this.selectedMetaPage) {
          const foundIdx = tabContext.tabList.findIndex(p => p.name === this.selectedMetaPage.name);
          if (foundIdx >= 0) {
            targetIdx = foundIdx;
          }
        } else if (savedTabName) {
          const foundIdx = tabContext.tabList.findIndex(p => p.name === savedTabName);
          if (foundIdx >= 0) {
            targetIdx = foundIdx;
          }
        }

        const activeTab = tabContext.tabList[targetIdx];
        this.onTabMetaPageSelected(activeTab, targetIdx);
        console.log(`Set active tab = ${activeTab.name} (index ${targetIdx})`);
      }

      return of(tabContext);
    }));
  }

  extractNames(...names: string[]) {
    return names.filter(s => s !== null && s.length > 0);
  }

  onClick() {
    if (this.editorMode) {
      this.doEditorAction();
    }
  }

  doEditorAction() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Tab', this.tabTool);
  }

  onTabMetaPageSelected(tabMetaPage: MetaPage, selectedTabIdx: number) {
    console.log(`Tab Selected: metaPage = ${tabMetaPage.name}`);
    this.selectedMetaPage = tabMetaPage;
    this.selectedTabIdx = selectedTabIdx;
    if(tabMetaPage.templates && tabMetaPage.templates.length > 0) {
      this.selectedTemplate = tabMetaPage.templates[0];
      console.log(`Template Selected: ${this.selectedTemplate.binding}`);
    }
    const key = this.getTabKey();
    if (key && tabMetaPage?.name) {
      TabToolComponent.tabStateMap.set(key, tabMetaPage.name);
    }
  }
}
