import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit, Optional} from '@angular/core';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {MetaPage, PageTitleTool, PageType} from '../../../../../domain/meta.page';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {MetaPageService} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {FormGroup} from '@angular/forms';
import {Subject, takeUntil} from 'rxjs';

@Component({
    selector: 'lib-page-title-tool',
    templateUrl: './page-title-tool.component.html',
    styleUrls: ['./page-title-tool.component.css'],
    standalone: false
})
export class PageTitleToolComponent implements OnInit, OnDestroy {

  @Input()
  pageTitleTool: PageTitleTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  nameAttributes: string[] | null = null; // the list of name attributes to extract from the entity when the title template needs it
  pageMode: string; // extends mode to include all of (search, view, add, update)

  formGroup: FormGroup;

  metaPage: MetaPage | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    protected readonly propertySheetService: PropertySheetService,
    @Optional() protected readonly metaPageService?: MetaPageService,
    @Optional() private readonly cd?: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.editorMode) {
      if (this.metaPageService) {
        this.metaPageService.currentMetaPage$
          .pipe(takeUntil(this.destroy$))
          .subscribe(metaPage => {
            this.metaPage = metaPage;
            this.cd?.markForCheck();
          });
      }
    } else {
      console.log('formMap:', this.ctx.formMap);

      // This is probably a bit dodgy since it probably should feed off the Template's binding, but will do for now.
      // ALSO - during initial development tried to get the "value" of the FormGroup to then get the name values but
      // that only worked for Edit and not for View. Wasn't able to figure out why, so asked the Controls for their
      // values instead
      const abstractControl = this.ctx.formMap.values().next().value;
      if (abstractControl instanceof FormGroup) {
        this.formGroup = abstractControl;

        const isNew = !this.formGroup.get('id')?.value;
        this.pageMode = PageTitleToolComponent.toPageMode(this.ctx.mode, isNew);
        if (this.pageTitleTool && this.pageTitleTool.nameAttributes) {
          this.nameAttributes = this.pageTitleTool.nameAttributes.split(',');
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentMetaPage(): MetaPage | null {
    return this.ctx?.metaPage || this.metaPage || this.metaPageService?.currentMetaPage$?.value || null;
  }

  isStaticTitle(): boolean {
    const metaPage = this.currentMetaPage;
    return !!(metaPage && metaPage.title && metaPage.title !== '$PageTitle');
  }

  usingNames(): boolean {
    if (this.editorMode) {
      return !!(this.pageTitleTool?.nameAttributes && this.pageTitleTool.nameAttributes.trim().length > 0);
    }
    return this.nameAttributes !== null && this.nameAttributes.length > 0;
  }

  get editorTitle(): string {
    if (this.isStaticTitle()) {
      return this.currentMetaPage?.title || '';
    }

    const pageType = this.currentMetaPage?.type;
    switch (pageType) {
      case PageType.search:
      case PageType.search_edit:
        return 'Search {{entityNamePlural}}';
      case PageType.view_edit:
      case PageType.composite:
        return this.usingNames() ? '{{fullName}}' : '{{entityNameSingular}}';
      case PageType.map:
        return 'Map {{entityNamePlural}}';
      case PageType.content:
        return '{{title}}';
      default:
        return 'Search {{entityNamePlural}}';
    }
  }

  get entityNameSingular() {
    return this.ctx.metaEntity.name.toLowerCase();
  }

  get entityNamePlural() {
    return this.ctx.metaEntity.pluralName.toLowerCase();
  }

  getNameValue(controlName: string) {
    return this.formGroup.controls[controlName].value;
  }

  get fullName() {
    return this.nameAttributes ? this.nameAttributes.map(name => this.getNameValue(name)).join(' ') : '';
  }

  get firstName() {
    return this.nameAttributes ? this.getNameValue(this.nameAttributes[0]) : '';
  }

  static toPageMode(mode: string, isNew: boolean) {
    if (mode === 'edit') {
      return isNew ? 'add' : 'update';
    } else {
      return mode;
    }
  }

  onEditorModeClick() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Page title', this.pageTitleTool);
  }
}
