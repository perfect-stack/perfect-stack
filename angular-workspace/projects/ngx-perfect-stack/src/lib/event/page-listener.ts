import {FormContext} from '../data/data-edit/form-service/form.service';
import {ParamMap} from '@angular/router';
import {MetaAttribute} from '../domain/meta.entity';
import {PerfectStackEventListener} from './perfect-stack-event-listener';
import {FormGroup} from '@angular/forms';

export interface PageListener extends PerfectStackEventListener {
  onPageLoad(ctx: FormContext, params: ParamMap, queryParams: ParamMap): void;
  onAction(ctx: FormContext, action: string): void;
  onManyToOneItemSelected(formGroup: FormGroup, attribute: MetaAttribute, itemSelected: any): void;
  onBeforeSave(ctx: FormContext): void;
  onAfterSave(ctx: FormContext): void;
}
