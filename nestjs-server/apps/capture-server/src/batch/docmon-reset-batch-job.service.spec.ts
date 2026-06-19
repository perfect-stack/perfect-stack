import { Test, TestingModule } from '@nestjs/testing';
import { DocMonResetBatchJobService } from './docmon-reset-batch-job.service';
import { DataService } from '@perfect-stack/nestjs-server/data/data.service';
import { QueryService } from '@perfect-stack/nestjs-server/data/query.service';

describe('DocMonResetBatchJobService', () => {
  let service: DocMonResetBatchJobService;
  let mockDataService: any;
  let mockQueryService: any;

  beforeEach(async () => {
    mockDataService = {
      truncateTable: jest.fn().mockResolvedValue(undefined)
    };

    mockQueryService = {
      findAll: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocMonResetBatchJobService,
        { provide: DataService, useValue: mockDataService },
        { provide: QueryService, useValue: mockQueryService }
      ]
    }).compile();

    service = module.get<DocMonResetBatchJobService>(DocMonResetBatchJobService);
    jest.clearAllMocks();
  });

  it('should call truncateTable with MonitoringStation', async () => {
    await service.execute();

    // Verify truncateTable was called with 'MonitoringStation'
    expect(mockDataService.truncateTable).toHaveBeenCalledTimes(1);
    expect(mockDataService.truncateTable).toHaveBeenCalledWith('MonitoringStation');
  });
});
