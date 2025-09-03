import { Test, TestingModule } from '@nestjs/testing';
import { NestjsServerService } from './nestjs-server.service';

describe('NestjsServerService', () => {
  let service: NestjsServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestjsServerService],
    }).compile();

    service = module.get<NestjsServerService>(NestjsServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
