import { StationSensorAction } from './station-sensor-action';

export enum StationSensorActivityType {
    DEPLOY_SENSOR = 'DEPLOY_SENSOR',
    RETRIEVE_SENSOR = 'RETRIEVE_SENSOR',
    SWAP_DEVICE = 'SWAP_DEVICE',
    SWAP_CARD = 'SWAP_CARD'
}

export enum StationSensorActivityStatus {
    Draft = 'Draft',
    Syncing = 'Syncing',
    Submitted = 'Submitted',
    Error = 'Error'
}

export class StationSensorActivity {
    id?: string;
    monitoring_station?: any;
    monitoring_station_id?: string;
    performed_by?: string;
    activity_type?: StationSensorActivityType | string;
    existing_sensor_action?: StationSensorAction;
    existing_sensor_action_id?: string;
    new_sensor_action?: StationSensorAction;
    new_sensor_action_id?: string;
    status?: StationSensorActivityStatus | string;
    activity_datetime?: string | Date;
    notes?: string;
    created_at?: string | Date;
    updated_at?: string | Date;
}
