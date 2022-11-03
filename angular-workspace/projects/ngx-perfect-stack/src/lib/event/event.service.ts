import {Injectable} from '@angular/core';
import {CompletionResult, PageListener} from './page-listener';
import {FormContext} from '../data/data-edit/form-service/form.service';
import {ParamMap} from '@angular/router';
import {MetaAttribute} from '../domain/meta.entity';
import {PerfectStackEventListener} from './perfect-stack-event-listener';
import {UntypedFormGroup} from '@angular/forms';
import {ActionListener} from './action-listener';
import {SaveResponse} from '../data/data-service/save.response';

enum ListenerType {
  ActionListener = 'ActionListener',
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

  addActionListener(actionListener: ActionListener, pageName: string, channel: string) {
    // TODO: need to do more with the channel idea
    this.getListenerList(ListenerType.ActionListener, pageName).push(actionListener);
  }

  dispatchOnPageLoad(pageName: string, ctx: FormContext, params: ParamMap, queryParams: ParamMap): void {
    console.log(`Dispatch onPageLoad to page listeners: ${pageName}`);
    const listenerList = this.getListenerList(ListenerType.PageListener, pageName);
    for(const listener of listenerList) {
      const pageListener = listener as PageListener;
      pageListener.onPageLoad(ctx, params, queryParams);
    }
  }

  dispatchOnAction(pageName: string, channel: string, ctx: FormContext, action: string): void {
    console.log(`Dispatch onAction(${action}) to page listeners: ${pageName} on channel: ${channel}`);
    const listenerList = this.getListenerList(ListenerType.PageListener, pageName);
    for(const listener of listenerList) {
      const pageListener = listener as PageListener;
      pageListener.onAction(ctx, channel, action);
    }

    console.log(`Dispatch onAction(${action}) to action listeners: ${pageName} on channel: ${channel}`);
    const listenerList2 = this.getListenerList(ListenerType.ActionListener, pageName);
    for(const listener of listenerList2) {
      const actionListener = listener as ActionListener;
      actionListener.onAction(ctx, channel, action);
    }
  }

  dispatchOnManyToOneItemSelected(pageName: string, formGroup: UntypedFormGroup, attribute: MetaAttribute, itemSelected: any): void {
    console.log(`Dispatch event , {emitEvent: false} to meta page listeners: ${pageName}`);
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

  dispatchOnCompletion(pageName: string, ctx: FormContext, saveResponse: SaveResponse | null): string {
    console.log(`Dispatch event , {emitEvent: false} to meta page listeners: ${pageName}`);
    let completionResult: string = CompletionResult.Continue;
    const listenerList = this.getListenerList(ListenerType.PageListener, pageName);
    for(const listener of listenerList) {
      const pageListener = listener as PageListener;
      const pageResult = pageListener.onCompletion(ctx, saveResponse);
      completionResult = pageResult > completionResult ? pageResult : completionResult;
    }
    return completionResult;
  }
}
