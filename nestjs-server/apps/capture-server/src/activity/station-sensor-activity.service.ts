import { Injectable, Logger } from '@nestjs/common';
import { DataService } from '@perfect-stack/nestjs-server/data/data.service';
import { QueryService } from '@perfect-stack/nestjs-server/data/query.service';
import { StationSensorAction, StationSensorActivity } from '../domain';
import { Event } from "../domain/event";
import { DataNotFound } from '@perfect-stack/nestjs-server/data/data.exception';
import {AttributeType, ComparisonOperator, MetaEntity} from '@perfect-stack/nestjs-server/domain/meta.entity';
import {EntityResponse} from "@perfect-stack/nestjs-server/domain/response/entity.response";
import {MetaEntityService} from "@perfect-stack/nestjs-server";


@Injectable()
export class StationSensorActivityService {
  private readonly logger = new Logger(StationSensorActivityService.name);

  constructor(
    private readonly dataService: DataService,
    private readonly queryService: QueryService,
    private readonly metaEntityService: MetaEntityService,
  ) { }

  async findAll(pageNumber?: number, pageSize?: number) {
    return this.queryService.findAll('StationSensorActivity', pageNumber, pageSize);
  }

  async findOne(id: string) {
    return this.queryService.findOne('StationSensorActivity', id);
  }

  async save(activity: StationSensorActivity): Promise<EntityResponse> {
    this.logger.log(`Saving StationSensorActivity: ${JSON.stringify(activity)}`);
    const saveResult = await this.createOrUpdateEventFromActivity(activity);

    const metaEntityList = await this.metaEntityService.findAll();
    const metaEntityMap = new Map<string, MetaEntity>();
    for (const nextMetaEntity of metaEntityList) {
        metaEntityMap.set(nextMetaEntity.name, nextMetaEntity);
    }

    const metaEntity = metaEntityMap.get('StationSensorActivity');
    if (!metaEntity) {
        throw new Error(`Unable to find MetaEntity StationSensorActivity`);
    }

    const activityEntityResponse: EntityResponse = await this.dataService.saveValidatedEntity(activity as any, metaEntity, metaEntityMap);

    return activityEntityResponse
  }


  public async createOrUpdateEventFromActivity(activity: StationSensorActivity): Promise<void> {
    this.logger.log(`createUpdateEventFromActivity activity: ${JSON.stringify(activity)}`);

    const stationSensorActivity = activity as StationSensorActivity;

    // For each "new_sensor_action" create an Event
    // There needs to be some sort of minimum level of data available before we can
    // create the event

    // Dereference to keep things simple
    const newSensorAction: StationSensorAction = stationSensorActivity.new_sensor_action;
    if (newSensorAction) {
      if (newSensorAction.storage_id) {
        // Find any "open" Event with storage_id = newSensorStorageId
        const existingStartEvent = await this.findEventForStorageId(newSensorAction.storage_id);

        // If there is any "open" event for this storage_id then we are doing an update
        // If event found and event status allows for updates
        if (existingStartEvent) {
          if (existingStartEvent.processing_status === 'Missing Start Activity') {
            await this.updateStartEvent(stationSensorActivity, existingStartEvent);
          }
          // Else TODO: current status does not permit updates - throw error?
        }
        else {
          // Else there is no "open" event for this storage_id so we are doing a create
          await this.createStartEvent(stationSensorActivity)
        }
      }
      // ELSE TODO: what do we do if storage_id not available? Throw error?
    }
    // else new_sensor_action is null or empty so we ignore it


    // For each "existing_sensor_action" attempt to find the relevant Event
    //  - based on Monitoring station?
    //  - based on Sensor?
    //  - based on SD card?      <<<<<<<< probably just this?
    //  - based on some combination?

    // Dereference to keep things simple
    const existingSensorAction = stationSensorActivity.existing_sensor_action;
    if (existingSensorAction) {
      if (existingSensorAction.storage_id) {
        const existingEndEvent = await this.findEventForStorageId(existingSensorAction.storage_id);

        // If event found
        if (existingEndEvent) {
          // If event status allows for updates
          if (existingEndEvent.processing_status === 'Waiting for End Activity') {
            // Populate the "End" attributes
            // Set processing_status = "Waiting for Card Upload"
            // Update Event
            await this.updateEndEvent(stationSensorActivity, existingEndEvent);
          }
          // ELSE TODO: event found but can't be updated (so now what do we do?)
        }
        else {
          // ELSE If existing event not found
          // Create the Event anyway (we need something to report status)
          // Populate the "End" attributes
          // Set processing_status = "Missing Start Activity"
          await this.createEndEvent(stationSensorActivity);
        }
      }
      // ELSE TODO: existing sensor action but no storage id
    }
    // Else existing_sensor_action is null or empty so we ignore it

    return;
  }

  private async createStartEvent(stationSensorActivity: StationSensorActivity) {

    const newSensorAction: StationSensorAction = stationSensorActivity.new_sensor_action;

    // Create the event
    const newSensorEvent: Event = new Event();

    // station - is mandatory and must be present
    const station = await this.findOptionalEntity('MonitoringStation', stationSensorActivity.monitoring_station_id);
    if(station) {
      newSensorEvent.station = station;
      newSensorEvent.station_id = station.id;
    }
    else {
      throw new Error('Station is required for new sensor action');
    }


    // find the sensor - or set to null
    const sensor = await this.findSensorForSensorId(newSensorAction.sensor_id);
    if(sensor) {
      newSensorEvent.sensor = sensor;
      newSensorEvent.sensor_id = sensor.id;
    }
    else {
      newSensorEvent.sensor = null;
      newSensorEvent.sensor_id = null;
    }

    // Populate the "start" attributes
    newSensorEvent.start_datetime = stationSensorActivity.activity_datetime;
    newSensorEvent.device_start_time = newSensorAction.sensor_datetime;
    newSensorEvent.storage_id = newSensorAction.storage_id;

    if(newSensorAction.protocol_id) {
        newSensorEvent.protocol_id = newSensorAction.protocol_id;
    }
    // TODO: Else error, protocol should be mandatory on create/start

    // Calculate status
    newSensorEvent.processing_status = this.calculateEventStatusForNewEvent(newSensorEvent);

    await this.dataService.save('Event', newSensorEvent);
  }

  private async updateStartEvent(stationSensorActivity: StationSensorActivity, existingStartEvent: Event) {
    const newSensorAction: StationSensorAction = stationSensorActivity.new_sensor_action;

    existingStartEvent.end_datetime = stationSensorActivity.activity_datetime;
    existingStartEvent.device_end_time = newSensorAction.sensor_datetime;

    // TODO: Hmm, for updates will only "assign" if present (i.e. can't set back to null?)
    if(newSensorAction.protocol_id) {
        existingStartEvent.protocol_id = newSensorAction.protocol_id;
    }

    // Calculate status
    existingStartEvent.processing_status = this.calculateEventStatusForNewEvent(existingStartEvent);

    await this.dataService.save('Event', existingStartEvent);
  }


  private async createEndEvent(stationSensorActivity: StationSensorActivity) {
    const existingSensorAction: StationSensorAction = stationSensorActivity.existing_sensor_action;
    const newEndEvent = new Event();
    newEndEvent.station = stationSensorActivity.monitoring_station;
    newEndEvent.sensor = await this.findOptionalEntity('Sensor', existingSensorAction.sensor_id);
    newEndEvent.end_datetime = stationSensorActivity.activity_datetime;
    newEndEvent.device_end_time = existingSensorAction.sensor_datetime;
    newEndEvent.storage_id = existingSensorAction.storage_id;

    // Populate the protocol for end events?
    if(existingSensorAction.protocol_id) {
        newEndEvent.protocol_id = existingSensorAction.protocol_id;
    }

    // Status is missing the start activity because we didn't find one by Storage ID
    newEndEvent.processing_status = 'Missing Start Activity';

    await this.dataService.save('Event', newEndEvent);
  }

  private async updateEndEvent(stationSensorActivity: StationSensorActivity, existingEndEvent: Event) {

    const existingSensorAction = stationSensorActivity.existing_sensor_action;

    if (existingEndEvent.storage_id !== existingSensorAction.storage_id) {
      // just trying to highlight why we don't copy over the storage_id from the activity
      throw new Error('This should not happen scince we did a query to find by storage_id');
    }

    existingEndEvent.end_datetime = stationSensorActivity.activity_datetime;
    existingEndEvent.device_end_time = existingSensorAction.sensor_datetime;

    // Should or should not update the Protocol?

    existingEndEvent.processing_status = 'Waiting for Card Upload';

    const saveResponse = await this.dataService.save('Event', existingEndEvent);
    return;
  }

  private calculateEventStatusForNewEvent(sensorEvent: Event) {
    let status = null;

    if (!sensorEvent.station) {
      status = 'No Monitoring Station';
    }
    else if (!sensorEvent.sensor) {
      status = 'No Sensor';
    }
    else if (!sensorEvent.start_datetime) {
      status = 'No Start date time';
    }
    else if (!sensorEvent.storage_id) {
      status = 'No storage ID'
    }

    if (!status) {
      if (sensorEvent.station && sensorEvent.sensor && sensorEvent.start_datetime && sensorEvent.storage_id) {
        status = 'Waiting for End Activity';
      }
    }

    if (!status) {
      throw new Error('Could not calculate status for event');
    }

    return status;
  }



  private async findEventForStorageId(storage_id: string): Promise<Event | null> {
    const queryResponse = await this.queryService.findByCriteria({
      metaEntityName: 'Event',
      criteria: [
        {
          name: 'storage_id',
          attributeType: AttributeType.Text,
          operator: ComparisonOperator.Equals,
          value: storage_id
        }
        // TODO: add criteria to limit the results to "open" Events only
      ],
      orderByName: 'storage_id',
      orderByDir: 'DESC',
      pageNumber: 1,
      pageSize: 1
    });

    if (queryResponse && queryResponse.resultList) {
      if (queryResponse.resultList.length === 0) {
        return null;
      }
      else if (queryResponse.resultList.length === 1) {
        return queryResponse.resultList[0];
      }
      else {
        // We don't want this one to happen, but it might
        throw new Error('Multiple events found for storage ID: ' + storage_id);
      }
    }
    else {
      // This one shouldn't really happen, the query should always return a result
      throw new Error('No query response for storage ID: ' + storage_id)
    }
  }

    private async findSensorForSensorId(sensor_id: string): Promise<any | null> {
    const queryResponse = await this.queryService.findByCriteria({
      metaEntityName: 'Sensor',
      criteria: [
        {
          name: 'sensor_id',
          attributeType: AttributeType.Text,
          operator: ComparisonOperator.Equals,
          value: sensor_id
        }
        // TODO: add criteria to limit the results to "open" Events only
      ],
      orderByName: 'sensor_id',
      orderByDir: 'DESC',
      pageNumber: 1,
      pageSize: 1
    });

    if (queryResponse && queryResponse.resultList) {
      if (queryResponse.resultList.length === 0) {
        return null;
      }
      else if (queryResponse.resultList.length === 1) {
        return queryResponse.resultList[0];
      }
      else {
        // We don't want this one to happen, but it might
        throw new Error('Multiple sensors found for sensor ID: ' + sensor_id);
      }
    }
    else {
      // This one shouldn't really happen, the query should always return a result
      throw new Error('No query response for sensor ID: ' + sensor_id)
    }
  }

  private async findOptionalEntity(entityName: string, id?: string) {
    if (id) {
      try {
        return await this.queryService.findOne(entityName, id);
      }
      catch (e) {
        if (e instanceof DataNotFound) {
          return null;
        }
        throw e;
      }
    }
    return null;
  }
}
