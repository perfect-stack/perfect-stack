import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {PageTitleTool} from '../../../../../domain/meta.page';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-page-title-tool',
  templateUrl: './page-title-tool.component.html',
  styleUrls: ['./page-title-tool.component.css']
})
export class PageTitleToolComponent implements OnInit {

  @Input()
  pageTitleTool: PageTitleTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  nameAttributes: string[] | null = null; // the list of name attributes to extract from the entity when the title template needs it
  pageMode: string; // extends mode to include all of (search, view, add, update)

  formGroup: FormGroup;

  constructor(protected readonly propertySheetService: PropertySheetService) { }

  ngOnInit(): void {
    if(!this.editorMode) {
      console.log('formMap:', this.ctx.formMap);

      // This is probably a bit dodgy since it probably should feed off the Template's binding, but will do for now.
      // ALSO - during initial development tried to get the "value" of the FormGroup to then get the name values but
      // that only worked for Edit and not for View. Wasn't able to figure out why, so asked the Controls for their
      // values instead
      this.formGroup = this.ctx.formMap.values().next().value;

      const isNew = this.formGroup.get('id')?.value === null;
      this.pageMode = PageTitleToolComponent.toPageMode(this.ctx.mode, isNew);
      if(this.pageTitleTool.nameAttributes) {
        this.nameAttributes = this.pageTitleTool.nameAttributes.split(',');
      }
    }
  }

  isStaticTitle() {
    return this.ctx.metaPage.title !== '$PageTitle';
  }

  usingNames() {
    return this.nameAttributes !== null && this.nameAttributes.length > 0;
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
    if(mode === 'edit') {
      return isNew ? 'add' : 'update';
    }
    else {
      return mode;
    }
  }

  onEditorModeClick() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Page title', this.pageTitleTool);
  }
}
