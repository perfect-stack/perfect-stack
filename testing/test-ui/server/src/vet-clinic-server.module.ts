import {
  Body,
  Controller,
  Get,
  Injectable,
  Logger,
  Module,
  OnApplicationBootstrap,
  Param,
  Post,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  ClientConfigModule,
  DataImportModule,
  DataModule,
  JobModule,
  JobService,
  KnexModule,
  MetaEntityModule,
  MetaMenuModule,
  MetaPageModule,
  MetaRoleModule,
  OrmModule,
  RuleModule,
  SettingsModule,
  TypeaheadModule,
} from '@perfect-stack/nestjs-server';
import * as path from 'path';
import { PetScanBatchJobService } from './pet-scan-batch-job.service';

const envFile = process.env.NESTJS_ENV || path.resolve(__dirname, '../local.env');

export const CONFIG_MODULE = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [envFile],
});

@Controller('authentication')
export class TestAuthenticationController {
  @Post('notification')
  loginNotification(@Body() body: any) {
    return { success: true };
  }

  @Get('last-sign-in/:username')
  lastSignIn(@Param('username') username: string) {
    return { username, lastSignIn: new Date().toISOString() };
  }
}

@Injectable()
export class VetClinicServerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(VetClinicServerService.name);

  constructor(
    protected readonly jobService: JobService,
    protected readonly petScanBatchJobService: PetScanBatchJobService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('VetClinicServerService: initializing application bootstrap');
    this.addBatchJobs();
  }

  private addBatchJobs(): void {
    this.jobService.registerJob(PetScanBatchJobService.JOB_NAME, this.petScanBatchJobService);
    this.logger.log(`Registered batch job: ${PetScanBatchJobService.JOB_NAME}`);
  }
}

@Module({
  imports: [
    CONFIG_MODULE,
    EventEmitterModule.forRoot(),
    OrmModule,
    DataImportModule,
    JobModule,
    KnexModule,
    MetaEntityModule,
    MetaMenuModule,
    MetaPageModule,
    MetaRoleModule,
    DataModule,
    RuleModule,
    SettingsModule,
    TypeaheadModule,
    ClientConfigModule,
  ],
  controllers: [TestAuthenticationController],
  providers: [VetClinicServerService, PetScanBatchJobService],
  exports: [VetClinicServerService, PetScanBatchJobService],
})
export class VetClinicServerModule {}
