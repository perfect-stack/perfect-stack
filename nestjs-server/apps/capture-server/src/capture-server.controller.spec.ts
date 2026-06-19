import { Test, TestingModule } from '@nestjs/testing';
import { CaptureServerController } from './capture-server.controller';
import { CaptureServerService } from './capture-server.service';
import { MetaEntityService } from "@perfect-stack/nestjs-server/meta/meta-entity/meta-entity.service";
import { MetaMenuService } from "@perfect-stack/nestjs-server/meta/meta-menu/meta-menu.service";
import { MapService } from "@perfect-stack/nestjs-server/map/map.service";
import { DataService } from "@perfect-stack/nestjs-server/data/data.service";
import { QueryService } from "@perfect-stack/nestjs-server/data/query.service";
import { BatchService } from "@perfect-stack/nestjs-server/batch/batch.service";
import { CustomQueryService } from "@perfect-stack/nestjs-server/data/custom-query.service";
import { CustomRuleService } from "@perfect-stack/nestjs-server/data/rule/custom-rule.service";
import { KnexService } from "@perfect-stack/nestjs-server/knex/knex.service";
import { DiscriminatorService } from "@perfect-stack/nestjs-server/data/discriminator.service";
import { MediaRepositoryService } from "@perfect-stack/nestjs-server/media/media-repository.service";
import { EventService } from "@perfect-stack/nestjs-server/event/event.service";
import { SettingsService } from "@perfect-stack/nestjs-server/settings/settings.service";
import { MonitoringStationBatchJobService } from "./batch/monitoring-station-batch-job.service";
import { DocMonSyncBatchJobService } from "./batch/docmon-sync-batch-job.service";
import { DocMonResetBatchJobService } from "./batch/docmon-reset-batch-job.service";
import { CaptureSchemaListener } from './app-event/capture-schema.listener';
import { StationSensorActivityListener } from './app-event/station-sensor-activity.listener';

describe('CaptureServerController', () => {
  let captureServerController: CaptureServerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CaptureServerController],
      providers: [
        CaptureServerService,
        { provide: MetaEntityService, useValue: {} },
        { 
          provide: MetaMenuService, 
          useValue: { 
            getVersion: () => ({ serverRelease: '1.0.0' }) 
          } 
        },
        { provide: MapService, useValue: {} },
        { provide: DataService, useValue: {} },
        { provide: QueryService, useValue: {} },
        { provide: BatchService, useValue: {} },
        { provide: CustomQueryService, useValue: {} },
        { provide: CustomRuleService, useValue: {} },
        { provide: KnexService, useValue: {} },
        { provide: DiscriminatorService, useValue: {} },
        { provide: MediaRepositoryService, useValue: {} },
        { provide: EventService, useValue: {} },
        { provide: SettingsService, useValue: {} },
        { provide: MonitoringStationBatchJobService, useValue: {} },
        { provide: DocMonSyncBatchJobService, useValue: {} },
        { provide: DocMonResetBatchJobService, useValue: {} },
        { provide: CaptureSchemaListener, useValue: {} },
        { provide: StationSensorActivityListener, useValue: {} },
      ],
    }).compile();

    captureServerController = app.get<CaptureServerController>(CaptureServerController);
  });

  describe('root', () => {
    it('should return health check message', () => {
      expect(captureServerController.getHealth()).toContain('Health check ok at:');
    });
  });
});
