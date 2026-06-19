import {Injectable} from "@nestjs/common";
import {BatchJob} from "@perfect-stack/nestjs-server";
import {DataService} from "@perfect-stack/nestjs-server/data/data.service";
import * as fs from 'fs';
import {QueryService} from "@perfect-stack/nestjs-server/data/query.service";

const monitoringStationJsonMap = {
    id: 'station_id',
    placeId: 'place_id',
    title: 'station_title',
    altitude: 'altitude',
    easting: 'easting',
    northing: 'northing',
    installed: 'installed_date',
    decommissioned: 'decommissioned_date',
    districtCode: 'district_code',
    districtName: 'district_name',
};


@Injectable()
export class MonitoringStationBatchJobService implements BatchJob {

    constructor(protected readonly dataService: DataService, protected readonly queryService: QueryService) {}

    async execute(): Promise<any> {
        console.log('Monitoring Station Batch Job Started');
        const jsonStr = fs.readFileSync('MonitoringStations.json', 'utf-8');
        const monitoringStationsJson = JSON.parse(jsonStr);
        console.log(`Found ${monitoringStationsJson.length} monitoring stations in JSON file.`);

        const existingStationsResponse = await this.queryService.findAll('MonitoringStation');
        const existingStations = existingStationsResponse.resultList;
        console.log(`Found ${existingStations.length} existing monitoring stations in database.`);

        let createdCount = 0;
        let updatedCount = 0;
        let deletedCount = 0;

        for(const stationJson of monitoringStationsJson) {
            const stationId = stationJson.id;
            const existingStation = existingStations.find((s: any) => s.station_id === stationId);

            const entityData = this.transformJsonToEntity(stationJson);

            if(existingStation) {
                // Update
                console.log(`Updating station with station_id ${stationId}`);
                entityData.id = existingStation.id;
                await this.dataService.save('MonitoringStation', entityData);
                updatedCount++;
            }
            else {
                // Create
                console.log(`Creating station with station_id ${stationId}`);
                await this.dataService.save('MonitoringStation', entityData);
                createdCount++;
            }
        }

        // Delete stations that are not in the JSON file
        const jsonStationIds = new Set(monitoringStationsJson.map((s: any) => s.id));
        for(const existingStation of existingStations) {
            if(!jsonStationIds.has((existingStation as any).station_id)) {
                console.log(`Deleting station with id ${existingStation.id} and station_id ${(existingStation as any).station_id}`);
                await this.dataService.destroy('MonitoringStation', existingStation.id);
                deletedCount++;
            }
        }

        console.log('Monitoring Station Batch Job Finished.');
        console.log(`Summary: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted.`);
    }

    transformJsonToEntity(json: any): any {
        const entity: any = {};
        for(const key in monitoringStationJsonMap) {
            entity[monitoringStationJsonMap[key]] = json[key];
        }
        return entity;
    }

    async getSummary(): Promise<any> {
        return {};
    }

}