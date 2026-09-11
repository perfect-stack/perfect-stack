import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';
import { DataModule } from '../data.module';
import { MetaEntityModule } from '../../meta/meta-entity/meta-entity.module';
import { DuplicateEventCheck } from './duplicate-event-check';
import { DuplicateMonitoringStationCheck } from './duplicate-monitoring-station-check';
import { DuplicatePlaceCheck } from './duplicate-place-check';
import { PostImportEventActions } from './post-import-event-actions';
import { DataImportFileService } from './data-import-file.service';
import { DataFormatService } from './data-format.service';
import { EsriModule } from '../../esri/esri.module';
import { JobModule } from '../../job/job.module';
import { JobService } from '../../job/job.service';
import { DataImportJobController } from '../../job/data-import-job.controller';

@Module({
  controllers: [DataImportController, DataImportJobController],
  imports: [DataModule, MetaEntityModule, EsriModule, JobModule],
  providers: [
    DataImportService,
    DataImportFileService,
    DuplicateEventCheck,
    DuplicateMonitoringStationCheck,
    DuplicatePlaceCheck,
    PostImportEventActions,
    DataFormatService,
  ],
  exports: [DataImportService, DataImportFileService],
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
      },
    });
  }
}
