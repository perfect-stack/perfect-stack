import { DataEventListener } from '../event/event.service';
import { MetaEntity } from '../domain/meta.entity';
import { ValidationResultMap } from '../domain/meta.rule';
import { MapService } from '../map/map.service';

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
