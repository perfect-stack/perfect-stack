import { Injectable, Logger } from '@nestjs/common';
import { CoordinateSummary } from './coordinate-converter.controller';
import { SettingsService } from '../settings/settings.service';
import { Pool } from 'pg';
import { MapService } from '../map/map.service';

@Injectable()
export class CoordinateConverterService {
  private readonly logger = new Logger(CoordinateConverterService.name);

  constructor(
    protected readonly mapService: MapService,
    protected readonly settingsService: SettingsService,
  ) {}

  async getSummary(): Promise<CoordinateSummary> {
    const pool = await this.settingsService.getDatabasePool();

    const selectCountSQL =
      'Select count(*) as total_count from "Event" where (easting is not null and northing is not null) and (lat is null or lng is null)';

    const selectCountResponse = await pool.query(selectCountSQL);
    const totalCount = Number(selectCountResponse.rows[0].total_count);

    this.logger.log(`WGS84 conversion needed for ${totalCount} rows.`);

    await pool.end();

    return {
      remainingCount: totalCount,
    };
  }

  async convert(): Promise<void> {
    const pool = await this.settingsService.getDatabasePool();

    const selectSql =
      'Select id, easting, northing from "Event" where (easting is not null and northing is not null) and (lat is null or lng is null)';

    const selectResponse = await pool.query(selectSql);
    const dataRows = selectResponse.rows;
    for (const nextRow of dataRows) {
      const id = nextRow.id;
      const easting = nextRow.easting;
      const northing = nextRow.northing;
      this.logger.log(`Convert Row: ${id}: ${easting}, ${northing}`);

      if (northing && easting) {
        const latLng = this.mapService.toLatLng({
          northing,
          easting,
        });

        this.logger.log(`      => ${latLng.lat}, ${latLng.lng}`);

        const updateSql = 'Update "Event" set lat = $1, lng = $2 where id = $3';
        await pool.query(updateSql, [latLng.lat, latLng.lng, id]);
      }
    }

    await pool.end();
  }
}
