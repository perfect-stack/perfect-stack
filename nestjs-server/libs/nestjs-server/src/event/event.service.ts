import { Injectable } from '@nestjs/common';
import { MetaEntity } from '../domain/meta.entity';
import { ValidationResultMap } from '../domain/meta.rule';

@Injectable()
export class EventService {
  listenerMap = new Map<ListenerType, Map<string, EventListener[]>>();

  getListenerList(listenerType: ListenerType, name: string): EventListener[] {
    if (!listenerType) {
      throw new Error(
        `ListenerType must be supplied but is ${JSON.stringify(listenerType)}`,
      );
    }

    if (!name) {
      throw new Error(`Name must be supplied but is ${JSON.stringify(name)}`);
    }

    let listenerMap = this.listenerMap.get(listenerType);
    if (!listenerMap) {
      listenerMap = new Map<string, EventListener[]>();
      this.listenerMap.set(listenerType, listenerMap);
    }

    let listenerList = listenerMap.get(name);
    if (!listenerList) {
      listenerList = [];
      listenerMap.set(name, listenerList);
    }

    return listenerList;
  }

  addDataEventListener(metaName: string, dataEventListener: DataEventListener) {
    this.getListenerList(ListenerType.DataEventListener, metaName).push(
      dataEventListener,
    );
  }

  async dispatchOnBeforeSave(
    entity: any,
    metaEntity: MetaEntity,
    metaEntityMap: Map<string, MetaEntity>,
  ): Promise<ValidationResultMap> {
    const listenerList = this.getListenerList(
      ListenerType.DataEventListener,
      metaEntity.name,
    );

    let validationResultMap = {};
    for (const listener of listenerList) {
      const listenerResults = await (
        listener as DataEventListener
      ).onBeforeSave(entity, metaEntity, metaEntityMap);

      validationResultMap = { ...validationResultMap, ...listenerResults };
    }

    return validationResultMap;
  }

  async dispatchOnAfterSave(entity: any, metaEntity: MetaEntity) {
    const listenerList = this.getListenerList(
      ListenerType.DataEventListener,
      metaEntity.name,
    );

    for (const listener of listenerList) {
      await (listener as DataEventListener).onAfterSave(entity, metaEntity);
    }
  }
}

export enum ListenerType {
  DataEventListener = 'DataEventListener',
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EventListener {}

export interface DataEventListener extends EventListener {
  onBeforeSave(
    entity: any,
    metaEntity: MetaEntity,
    metaEntityMap: Map<string, MetaEntity>,
  ): Promise<ValidationResultMap>;
  onAfterSave(entity: any, metaEntity: MetaEntity);
}
