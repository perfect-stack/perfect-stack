import { Injectable } from '@angular/core';
import {PageListener} from "../../../../ngx-perfect-stack/src/lib/event/page-listener";
import {UntypedFormGroup} from "@angular/forms";
import {ParamMap} from "@angular/router";
import {FormContext, MetaAttribute} from "@perfect-stack/ngx-perfect-stack";
import {SaveResponse} from "../../../../ngx-perfect-stack/src/lib/data/data-service/save.response";

@Injectable({
  providedIn: 'root'
})
export class StationSensorActivityListenerService implements PageListener {

  constructor() { }

  onAction(ctx: FormContext, channel: string, action: string): void {
    console.log('ON_ACTION:', ctx, channel, action);
  }

  onAfterSave(ctx: FormContext): void {
  }

  onBeforeSave(ctx: FormContext): void {
  }

  onCompletion(ctx: FormContext, saveResponse: SaveResponse | null): string {
    return "";
  }

  onManyToOneItemSelected(formGroup: UntypedFormGroup, attribute: MetaAttribute, itemSelected: any): void {
  }

  onPageLoad(ctx: FormContext, params: ParamMap, queryParams: ParamMap): void {
  }


}
