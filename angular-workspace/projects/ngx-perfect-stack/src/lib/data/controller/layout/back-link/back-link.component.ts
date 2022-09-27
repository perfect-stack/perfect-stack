import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../../../data-edit/form-service/form.service';

@Component({
  selector: 'lib-back-link',
  templateUrl: './back-link.component.html',
  styleUrls: ['./back-link.component.css']
})
export class BackLinkComponent implements OnInit {

  @Input()
  ctx: FormContext;

  backToLabel: string = 'Search Entity';
  backToRoute: string = '/data/Entity/search';

  constructor() { }

  ngOnInit(): void {

    const backTo = this.ctx.queryParamMap?.get('backTo');
    const fromId = this.ctx.queryParamMap?.get('fromId');
    if(backTo && fromId) {
      console.log(`GOT backTo ${backTo}: override back link to ...`);
      // This isn't ideal because it hard-codes things specifically for Bird, but the meta-data requirements will be
      // easier once we know what the additional use cases look like
      if(backTo === 'Bird') {
        this.backToLabel = `View bird`;
        this.backToRoute = `/data/Bird/view/${fromId}`;
      }
    }
    else {
      this.backToLabel = `Search ${this.ctx.metaEntity.pluralName.toLowerCase()}`;
      this.backToRoute = `/data/${this.ctx.metaEntity.name}/search`;
    }
  }

}
