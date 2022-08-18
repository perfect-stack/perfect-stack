import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../form-service/form.service';
import {TemplateType} from '../../../domain/meta.page';

@Component({
  selector: 'lib-stockholm-layout-style',
  templateUrl: './stockholm-layout-style.component.html',
  styleUrls: ['./stockholm-layout-style.component.css']
})
export class StockholmLayoutStyleComponent implements OnInit {

  @Input()
  ctx: FormContext;

  constructor() { }

  ngOnInit(): void {
  }

  get headerTemplates() {
    return this.ctx.metaPage.templates.filter(s => s.type === TemplateType.header);
  }

  get contentTemplates() {
    return this.ctx.metaPage.templates.filter(s => s.type !== TemplateType.header);
  }

}
