import { Test, TestingModule } from '@nestjs/testing';
import { CaptureServerController } from './capture-server.controller';
import { CaptureServerService } from './capture-server.service';

describe('CaptureServerController', () => {
  let captureServerController: CaptureServerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CaptureServerController],
      providers: [CaptureServerService],
    }).compile();

    captureServerController = app.get<CaptureServerController>(CaptureServerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(captureServerController.getHealth()).toBe('Hello World!');
    });
  });
});
