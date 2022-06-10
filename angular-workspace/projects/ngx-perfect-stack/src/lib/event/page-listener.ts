import {FormContext} from '../data/data-edit/form-service/form.service';
import {ParamMap} from '@angular/router';
import {MetaAttribute} from '../domain/meta.entity';

export interface PageListener extends EventListener {
  onPageLoad(ctx: FormContext, params: ParamMap, queryParams: ParamMap): void;
  onManyToOneItemSelected(ctx: FormContext, attribute: MetaAttribute, itemSelected: any): void;
  onBeforeSave(ctx: FormContext): void;
  onAfterSave(ctx: FormContext): void;
}
