import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppModule } from './app.module';
import { MetaEntityModule } from './meta/meta-entity/meta-entity.module';
import { DataModule } from './data/data.module';
import { MetaMenuModule } from './meta/meta-menu/meta-menu.module';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [AppModule, MetaEntityModule, MetaMenuModule, DataModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return a health check ok', () => {
      expect(appController.get().startsWith('Health check ok at')).toBeTruthy();
    });
  });
});
