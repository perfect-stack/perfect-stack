import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';
import { DataModule } from '../data.module';
import { MetaEntityModule } from '../../meta/meta-entity/meta-entity.module';
import { DuplicateEventCheck } from './duplicate-event-check';
import { DuplicateMonitoringStationCheck } from './duplicate-monitoring-station-check';
import { DuplicatePlaceCheck } from './duplicate-place-check';
import { PostImportEventActions } from './post-import-event-actions';
import { DataFormatService } from './data-format.service';
import { EsriModule } from '../../esri/esri.module';
import { JobModule } from '../../job/job.module';
import { JobService } from '../../job/job.service';
import { DataImportJobController } from '../../job/data-import-job.controller';
import { OrmModule } from '../../orm/orm.module';

@Module({
  controllers: [DataImportController, DataImportJobController],
  imports: [DataModule, MetaEntityModule, EsriModule, JobModule, OrmModule],
  providers: [
    DataImportService,
    DuplicateEventCheck,
    DuplicateMonitoringStationCheck,
    DuplicatePlaceCheck,
    PostImportEventActions,
    DataFormatService,
  ],
  exports: [DataImportService, DataFormatService],
})
export class DataImportModule implements OnApplicationBootstrap {
  constructor(
    protected readonly jobService: JobService,
    protected readonly dataImportService: DataImportService
  ) {}

  onApplicationBootstrap() {
    this.jobService.registerJob('Data Import - Validate', {
      type: 'step',
      showInBatchUI: () => false,
      executeStep: async (job, stepIdx) => {
        const data = JSON.parse(job.data);
        await this.dataImportService.dataImportValidate(stepIdx, data);
        job.data = JSON.stringify(data);
      },
      onComplete: async (job) => {
        const data = JSON.parse(job.data);
        data.status = 'validated';
        job.data = JSON.stringify(data);

        const skipRowCount = data.importResult ? data.importResult.filter((r: any) => r && (r.skipFlag || r.skipReason === 'Blank' || r.skipReason === 'Duplicate')).length : 0;
        const errorRowCount = data.importResult ? data.importResult.filter((r: any) => r && !r.skipFlag && r.errors && r.errors.length > 0).length : 0;
        const validRowCount = data.importResult ? data.importResult.filter((r: any) => r && !r.skipFlag && (!r.errors || r.errors.length === 0)).length : 0;
        const rowCount = data.dataRows ? data.dataRows.length : 0;
        const summary = `Rows: ${rowCount}, Valid: ${validRowCount}, Errors: ${errorRowCount}, Skipped: ${skipRowCount}`;

        job.row_count = rowCount;
        job.valid_count = validRowCount;
        job.error_count = errorRowCount;
        job.skipped_count = skipRowCount;
        job.result_summary = summary;

        await this.jobService.updateJobCounts(job.id, {
          row_count: rowCount,
          valid_count: validRowCount,
          error_count: errorRowCount,
          skipped_count: skipRowCount,
          result_summary: summary,
        });
      },
    });

    this.jobService.registerJob('Data Import - Import', {
      type: 'step',
      showInBatchUI: () => false,
      executeStep: async (job, stepIdx) => {
        const data = JSON.parse(job.data);
        await this.dataImportService.dataImportImport(stepIdx, data);
        job.data = JSON.stringify(data);
      },
      onComplete: async (job) => {
        const data = JSON.parse(job.data);
        data.status = 'imported';
        job.data = JSON.stringify(data);

        const importedCount = data.importResult ? data.importResult.filter((r: any) => r && !!r.actualEntity).length : 0;
        const errorRowCount = data.importResult ? data.importResult.filter((r: any) => r && !r.skipFlag && r.errors && r.errors.length > 0).length : 0;
        const skipRowCount = data.importResult ? data.importResult.filter((r: any) => r && (r.skipFlag || r.skipReason === 'Blank' || r.skipReason === 'Duplicate')).length : 0;
        const validRowCount = data.importResult ? data.importResult.filter((r: any) => r && !r.skipFlag && (!r.errors || r.errors.length === 0)).length : 0;
        const rowCount = data.dataRows ? data.dataRows.length : 0;
        const summary = `Imported: ${importedCount}, Errors: ${errorRowCount}, Skipped: ${skipRowCount}`;

        job.row_count = rowCount;
        job.imported_count = importedCount;
        job.error_count = errorRowCount;
        job.valid_count = validRowCount;
        job.skipped_count = skipRowCount;
        job.result_summary = summary;

        await this.jobService.updateJobCounts(job.id, {
          row_count: rowCount,
          imported_count: importedCount,
          error_count: errorRowCount,
          valid_count: validRowCount,
          skipped_count: skipRowCount,
          result_summary: summary,
        });
      },
    });
  }
}
