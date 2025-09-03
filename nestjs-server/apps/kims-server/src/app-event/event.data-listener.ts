import {DataEventListener} from "@perfect-stack/nestjs-server/event/event.service";
import {MapService} from "@perfect-stack/nestjs-server/map/map.service";
import {MetaEntity} from "@perfect-stack/nestjs-server/domain/meta.entity";
import {ValidationResultMap} from "@perfect-stack/nestjs-server/domain/meta.rule";

export class EventDataListener implements DataEventListener {
  constructor(protected readonly mapService: MapService) {}

  async onBeforeSave(
    entity: any,
    metaEntity: MetaEntity,
    metaEntityMap: Map<string, MetaEntity>,
  ): Promise<ValidationResultMap> {
    // convert any NZTM coordinates into WSG84 LatLng values
    const northing = entity['northing'];
    const easting = entity['easting'];

    if (northing && easting) {
      const latLng = this.mapService.toLatLng({
        northing,
        easting,
      });

      entity['lat'] = latLng.lat;
      entity['lng'] = latLng.lng;
    }

    const validationResultMap = {};
    return validationResultMap;
  }

  onAfterSave(entity: any, metaEntity: MetaEntity) {

    if(entity['media_files']) {
      const mediaFiles = entity['media_files'];
      console.log('mediaFiles:', mediaFiles);
    }

    return;
  }
}
