import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataService } from './data/data.service';
import { MetaEntityService } from './meta/meta-entity/meta-entity.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(
    protected readonly configService: ConfigService,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly dataService: DataService,
  ) {}

  get(): string {
    this.logger.log('Health check is ok.');
    return `Health check ok at: ${new Date().toISOString()}`;
  }

  getVersion(): any {
    const serverRelease = this.configService.get('SERVER_RELEASE', 'Unknown');
    return {
      serverRelease: serverRelease,
    };
  }

  async onApplicationBootstrap(): Promise<any> {
    await this.metaEntityService.syncMetaModelWithDatabase(false);
    return;
  }
}
