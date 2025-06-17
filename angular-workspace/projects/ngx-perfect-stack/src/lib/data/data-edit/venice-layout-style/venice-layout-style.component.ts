import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../form-service/form.service';
import {TemplateLocationType, TemplateType} from '../../../domain/meta.page';

@Component({
    selector: 'lib-venice-layout-style',
    templateUrl: './venice-layout-style.component.html',
    styleUrls: ['./venice-layout-style.component.css'],
    standalone: false
})
export class VeniceLayoutStyleComponent implements OnInit {

  @Input()
  ctx: FormContext;

  constructor() { }

  ngOnInit(): void {
    this.dumpDataMap();
  }

  dumpDataMap() {
    console.log('DumpDataMap: ', this.ctx.dataMap);
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
