import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {RouterLink} from '@angular/router';
import {FormContext} from '../form-service/form.service';

@Component({
  selector: 'lib-back-link',
  imports: [RouterLink],
  templateUrl: './back-link.component.html',
  styleUrls: ['./back-link.component.css'],
})
export class BackLinkComponent implements OnInit, OnChanges {

  @Input()
  ctx?: FormContext;

  @Input()
  label?: string;

  @Input()
  route?: string;

  backToLabel: string = 'Search jobs';
  backToRoute: string = '/data/Job/search';

  constructor() { }

  ngOnInit(): void {
    this.updateBackLink();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateBackLink();
  }

  private updateBackLink(): void {
    if (this.label) {
      this.backToLabel = this.label;
    }
    if (this.route) {
      this.backToRoute = this.route;
    }

    if (this.ctx) {
      const backTo = this.ctx.queryParamMap?.get('backTo');
      const fromId = this.ctx.queryParamMap?.get('fromId');
      if (backTo && fromId) {
        console.log(`GOT backTo ${backTo}: override back link to ...`);
        // This isn't ideal because it hard-codes things specifically for Bird, but the meta-data requirements will be
        // easier once we know what the additional use cases look like
        this.backToLabel = `View ${backTo.toLowerCase()}`;
        this.backToRoute = `/data/${backTo}/view/${fromId}`;
      } else if (!this.label && !this.route && this.ctx.metaEntity) {
        this.backToLabel = `Search ${this.ctx.metaEntity.pluralName.toLowerCase()}`;
        this.backToRoute = `/data/${this.ctx.metaEntity.name}/search`;
      }
    }
  }

}
