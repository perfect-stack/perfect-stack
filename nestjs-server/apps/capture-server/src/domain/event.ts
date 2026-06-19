import { Entity } from '@perfect-stack/nestjs-server/domain/entity';
import { StationSensorAction } from './station-sensor-action';

export class Event implements Entity {
    id: string;
    station?: any;
    station_id?: string;
    sensor?: any;
    sensor_id?: string;
    start_datetime?: string | Date;
    end_datetime?: string | Date;
    device_start_time?: string | Date;
    device_end_time?: string | Date;
    storage_id?: string;
    processing_status?: string;
    notes?: string;
    deploy_by?: string | StationSensorAction;
    retrieved_by?: string | StationSensorAction;
    protocol?: any;
    protocol_id?: string;
    created_at?: string | Date;
    updated_at?: string | Date;
}
