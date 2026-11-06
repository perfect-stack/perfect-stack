import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobController } from './job.controller';
import { DataModule } from '../data/data.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';
import { JobService } from './job.service';
import { OrmModule } from '../orm/orm.module';
import { JobSearchQuery } from './job-search.query';
import { CustomQueryService } from '../data/custom-query.service';

@Module({
  controllers: [JobController],
  imports: [ConfigModule, DataModule, MetaEntityModule, OrmModule],
  providers: [JobService, JobSearchQuery],
  exports: [JobService, JobSearchQuery],
})
export class JobModule implements OnApplicationBootstrap {
  constructor(
    protected readonly customQueryService: CustomQueryService,
    protected readonly jobSearchQuery: JobSearchQuery,
  ) {}

  onApplicationBootstrap() {
    this.customQueryService.addCustomQuery('JobSearch', this.jobSearchQuery);
  }
}

