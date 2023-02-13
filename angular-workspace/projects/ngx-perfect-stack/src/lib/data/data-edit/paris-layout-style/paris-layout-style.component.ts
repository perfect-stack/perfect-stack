import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../form-service/form.service';
import {TemplateLocationType, TemplateType} from '../../../domain/meta.page';

@Component({
  selector: 'lib-paris-layout-style',
  templateUrl: './paris-layout-style.component.html',
  styleUrls: ['./paris-layout-style.component.css']
})
export class ParisLayoutStyleComponent implements OnInit {

  @Input()
  ctx: FormContext;

  constructor() { }

  ngOnInit(): void {
  }

  hasHeaderTemplates() {
    return this.headerTemplates?.length > 0;
  }

  get headerTemplates() {
    return this.ctx.metaPage.templates.filter(s => s.type === TemplateType.header);
  }

  get contentTemplates() {
    return this.ctx.metaPage.templates.filter(s => s.type !== TemplateType.header);
  }

  get TemplateLocationType() {
    return TemplateLocationType;
  }
}
