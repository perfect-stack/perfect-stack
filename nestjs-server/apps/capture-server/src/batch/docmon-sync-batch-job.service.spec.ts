import { Test, TestingModule } from '@nestjs/testing';
import { DocMonSyncBatchJobService } from './docmon-sync-batch-job.service';
import { DataService } from '@perfect-stack/nestjs-server/data/data.service';
import { QueryService } from '@perfect-stack/nestjs-server/data/query.service';
import { StationsService, OpenAPI } from 'docmon-client';

jest.mock('docmon-client', () => {
  return {
    OpenAPI: {
      BASE: '',
      HEADERS: {}
    },
    StationsService: {
      getStations: jest.fn()
    }
  };
});

describe('DocMonSyncBatchJobService', () => {
  let service: DocMonSyncBatchJobService;
  let mockDataService: any;
  let mockQueryService: any;

  beforeEach(async () => {
    mockDataService = {
      save: jest.fn().mockResolvedValue({})
    };

    mockQueryService = {
      findAll: jest.fn().mockResolvedValue({
        resultList: [
          { id: 'uuid-1', station_id: '99985' } // Existing local station
        ]
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocMonSyncBatchJobService,
        { provide: DataService, useValue: mockDataService },
        { provide: QueryService, useValue: mockQueryService }
      ]
    }).compile();

    service = module.get<DocMonSyncBatchJobService>(DocMonSyncBatchJobService);
    jest.clearAllMocks();
  });

  it('should loop through all pages and sync monitoring stations to database (creating or updating accordingly)', async () => {
    // Mock getStations to return page 1 (hasNext: true), page 2 (hasNext: true), page 3 (hasNext: false)
    (StationsService.getStations as jest.Mock)
      .mockResolvedValueOnce({
        pageInfo: { totalCount: 3, count: 1, hasPrevious: false, hasNext: true },
        data: [{ id: 99985, title: 'Diggers 0207 Update', districtCode: 'H00890' }] // Exists locally (will update)
      })
      .mockResolvedValueOnce({
        pageInfo: { totalCount: 3, count: 1, hasPrevious: true, hasNext: true },
        data: [{ id: 99986, title: 'East Matukituki 0401', districtCode: 'H01070' }] // New station (will create)
      })
      .mockResolvedValueOnce({
        pageInfo: { totalCount: 3, count: 1, hasPrevious: true, hasNext: false },
        data: [{ id: 99987, title: 'Hawdon 29 10', districtCode: 'H01000' }] // New station (will create)
      });

    await service.execute();

    // Verify StationsService.getStations was called exactly 3 times
    expect(StationsService.getStations).toHaveBeenCalledTimes(3);
    expect(StationsService.getStations).toHaveBeenNthCalledWith(1, undefined, 1, 500);
    expect(StationsService.getStations).toHaveBeenNthCalledWith(2, undefined, 2, 500);
    expect(StationsService.getStations).toHaveBeenNthCalledWith(3, undefined, 3, 500);

    // Verify OpenAPI Prefer header was set for mock server pagination on each call
    // Note: Mocking imported modules modifies the actual object reference
    expect(OpenAPI.HEADERS).toEqual({ Prefer: 'example=page3' });

    // Verify dataService.save was called with correct values
    expect(mockDataService.save).toHaveBeenCalledTimes(3);

    // First call (Update) - should retain 'uuid-1'
    expect(mockDataService.save).toHaveBeenNthCalledWith(1, 'MonitoringStation', expect.objectContaining({
      id: 'uuid-1',
      station_id: 99985,
      station_title: 'Diggers 0207 Update',
      district_code: 'H00890'
    }));

    // Second call (Create) - no existing id
    expect(mockDataService.save).toHaveBeenNthCalledWith(2, 'MonitoringStation', expect.objectContaining({
      station_id: 99986,
      station_title: 'East Matukituki 0401'
    }));

    // Third call (Create) - no existing id
    expect(mockDataService.save).toHaveBeenNthCalledWith(3, 'MonitoringStation', expect.objectContaining({
      station_id: 99987,
      station_title: 'Hawdon 29 10'
    }));
  });
});
