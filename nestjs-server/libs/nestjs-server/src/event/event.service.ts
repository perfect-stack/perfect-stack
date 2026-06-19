import {Injectable} from '@nestjs/common';
import {MetaEntity} from '../domain/meta.entity';
import {ValidationResultMap} from '../domain/meta.rule';
import {EntityResponse} from "@perfect-stack/nestjs-server/domain/response/entity.response";

@Injectable()
export class EventService {
    dataListenerMap = new Map<ListenerType, Map<string, EventListener[]>>();
    schemaListenerList: SchemaListener[] = [];

    getListenerList(listenerType: ListenerType, name: string): EventListener[] {
        if (!listenerType) {
            throw new Error(
                `ListenerType must be supplied but is ${JSON.stringify(listenerType)}`,
            );
        }

        if (!name) {
            throw new Error(`Name must be supplied but is ${JSON.stringify(name)}`);
        }

        let listenerMap = this.dataListenerMap.get(listenerType);
        if (!listenerMap) {
            listenerMap = new Map<string, EventListener[]>();
            this.dataListenerMap.set(listenerType, listenerMap);
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

    addSchemaListener(schemaListener: SchemaListener) {
        this.schemaListenerList.push(schemaListener);
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

            validationResultMap = {...validationResultMap, ...listenerResults};
        }

        return validationResultMap;
    }

    hasCustomSave(entity: any, metaEntity: MetaEntity): boolean {
        const listenerList = this.getListenerList(
            ListenerType.DataEventListener,
            metaEntity.name,
        );

        for (const listener of listenerList) {
            if((listener as DataEventListener).hasCustomSave()) {
                return true;
            }
        }

        return false;
    }

    async dispatchOnCustomSave(
        entity: any,
        metaEntity: MetaEntity
    ): Promise<EntityResponse> {
        const listenerList = this.getListenerList(
            ListenerType.DataEventListener,
            metaEntity.name,
        );

        let entityResponse: EntityResponse = null;
        for (const listener of listenerList) {
            // TODO: Not ideal will only return the "last" saveResult - will do for now only expecting one DataListener
            // at a time to be doing custom saves.
            entityResponse = await (listener as DataEventListener).onCustomSave(entity, metaEntity);
        }

        return entityResponse;
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

    async dispatchOnSchemaUpdate() {
        for (const listener of this.schemaListenerList) {
            await listener.onSchemaUpdate();
        }
    }
}

export enum ListenerType {
    DataEventListener = 'DataEventListener'
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EventListener {
}

export interface DataEventListener extends EventListener {
    onBeforeSave(
        entity: any,
        metaEntity: MetaEntity,
        metaEntityMap: Map<string, MetaEntity>,
    ): Promise<ValidationResultMap>;

    hasCustomSave(): boolean;

    onCustomSave(entity: any, metaEntity: MetaEntity): Promise<EntityResponse>;

    onAfterSave(entity: any, metaEntity: MetaEntity);
}

export interface SchemaListener extends EventListener {
    onSchemaUpdate(): Promise<void>;
}