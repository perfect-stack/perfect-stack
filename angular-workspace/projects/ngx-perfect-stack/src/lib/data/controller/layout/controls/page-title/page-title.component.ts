import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../../../../data-edit/form-service/form.service';

@Component({
  selector: 'lib-page-title',
  templateUrl: './page-title.component.html',
  styleUrls: ['./page-title.component.css']
})
export class PageTitleComponent implements OnInit {

  @Input()
  ctx: FormContext

  @Input()
  nameAttributes: string[] | null = null; // the list of name attributes to extract from the entity when the title template needs it

  pageMode: string; // extends mode to include all of (search, view, add, update)

  constructor() { }

  ngOnInit(): void {
    const isNew = this.entity.id === null;
    this.pageMode = PageTitleComponent.toPageMode(this.ctx.mode, isNew);
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

  get entity(): any {
    return this.ctx.formMap.values().next().value;
  }

  get fullName() {
    return this.nameAttributes ? this.nameAttributes.map(name => this.entity[name]).join(' ') : '';
  }

  get firstName() {
    return this.nameAttributes ? this.entity[this.nameAttributes[0]] : '';
  }

  static toPageMode(mode: string, isNew: boolean) {
    if(mode === 'edit') {
      return isNew ? 'add' : 'update';
    }
    else {
      return mode;
    }
  }
}
