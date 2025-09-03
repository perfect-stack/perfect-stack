import { Test, TestingModule } from '@nestjs/testing';
import { KimsServerController } from './kims-server.controller';
import { KimsServerService } from './kims-server.service';

describe('KimsServerController', () => {
  let kimsServerController: KimsServerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [KimsServerController],
      providers: [KimsServerService],
    }).compile();

    kimsServerController = app.get<KimsServerController>(KimsServerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(kimsServerController.getHealth()).toBe('Hello World!');
    });
  });
});
