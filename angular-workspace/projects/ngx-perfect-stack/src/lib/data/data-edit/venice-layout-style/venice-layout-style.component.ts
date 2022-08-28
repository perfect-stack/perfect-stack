import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../form-service/form.service';
import {TemplateLocationType} from '../../../domain/meta.page';

@Component({
  selector: 'lib-venice-layout-style',
  templateUrl: './venice-layout-style.component.html',
  styleUrls: ['./venice-layout-style.component.css']
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

  get TemplateLocationType() {
    return TemplateLocationType;
  }

  get outerTopRightTool() {
    if(this.ctx.metaPage.templates && this.ctx.metaPage.templates.length > 0) {
      const firstTemplate = this.ctx.metaPage?.templates[0];
      if(firstTemplate?.locations) {
        return firstTemplate.locations[TemplateLocationType.OuterTopRight];
      }
    }
    return undefined;
  }
}
