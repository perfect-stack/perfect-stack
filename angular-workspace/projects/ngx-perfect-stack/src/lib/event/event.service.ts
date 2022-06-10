import { Injectable } from '@angular/core';
import {PageListener} from './page-listener';
import {FormContext} from '../data/data-edit/form-service/form.service';
import {ParamMap} from '@angular/router';
import {MetaAttribute} from '../domain/meta.entity';
import {PerfectStackEventListener} from './perfect-stack-event-listener';
import {FormGroup} from '@angular/forms';

enum ListenerType {
  PageListener = 'PageListener'
}

@Injectable({
  providedIn: 'root'
})
export class EventService {

  listenerMap = new Map<ListenerType, Map<string, PerfectStackEventListener[]>>();

  constructor() { }

  getListenerList(listenerType: ListenerType, name: string): PerfectStackEventListener[] {
    if(!listenerType) {
      throw new Error(`ListenerType must be supplied but is ${JSON.stringify(listenerType)}`);
    }

    if(!name) {
      throw new Error(`Name must be supplied but is ${JSON.stringify(name)}`);
    }

    let listenerMap = this.listenerMap.get(listenerType);
    if(!listenerMap) {
      listenerMap = new Map<string, PerfectStackEventListener[]>();
      this.listenerMap.set(listenerType, listenerMap);
    }

    let listenerList = listenerMap.get(name);
    if(!listenerList) {
      listenerList = [];
      listenerMap.set(name, listenerList);
    }

    return listenerList;
  }

  addPageListener(pageListener: PageListener, pageName: string ) {
    // TODO: check if exists already?
    this.getListenerList(ListenerType.PageListener, pageName).push(pageListener);
  }

  dispatchOnPageLoad(pageName: string, ctx: FormContext, params: ParamMap, queryParams: ParamMap): void {
    const listenerList = this.getListenerList(ListenerType.PageListener, pageName);
    for(const listener of listenerList) {
      const pageListener = listener as PageListener;
      pageListener.onPageLoad(ctx, params, queryParams);
    }
  }

  dispatchOnManyToOneItemSelected(pageName: string, formGroup: FormGroup, attribute: MetaAttribute, itemSelected: any): void {
    const listenerList = this.getListenerList(ListenerType.PageListener, pageName);
    for(const listener of listenerList) {
      const pageListener = listener as PageListener;
      pageListener.onManyToOneItemSelected(formGroup, attribute, itemSelected);
    }
  }

  dispatchOnBeforeSave(ctx: FormContext): void {

  }

  dispatchOnAfterSave(ctx: FormContext): void {

  }
}
