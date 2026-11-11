import { Test, TestingModule } from '@nestjs/testing';
import { DataImportJobController } from './data-import-job.controller';
import { ConfigService } from '@nestjs/config';
import { JobService } from './job.service';
import { DataImportService } from '../data/import/data-import.service';
import { OrmService } from '../orm/orm.service';
import { DataService } from '../data/data.service';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Op } from 'sequelize';

describe('DataImportJobController - rollbackJob', () => {
  let controller: DataImportJobController;
  let mockJobService: any;
  let mockDataImportService: any;
  let mockOrmService: any;
  let mockDataService: any;
  let mockModel: any;
  let mockLocationModel: any;
  let mockTransaction: any;

  beforeEach(async () => {
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    mockModel = {
      rawAttributes: { id: {}, job_id: {} },
      count: jest.fn().mockResolvedValue(0),
      findAll: jest.fn().mockResolvedValue([{ location_id: 'loc-1' }, { location_id: 'loc-2' }]),
      destroy: jest.fn().mockResolvedValue(100),
    };

    mockLocationModel = {
      destroy: jest.fn().mockResolvedValue(2),
    };

    mockOrmService = {
      sequelize: {
        model: jest.fn().mockImplementation((name: string) => {
          if (name === 'CaptureEvent') return mockModel;
          if (name === 'Location') return mockLocationModel;
          return null;
        }),
        transaction: jest.fn().mockResolvedValue(mockTransaction),
        getDialect: jest.fn().mockReturnValue('postgres'),
        query: jest.fn().mockResolvedValue([[], 1]),
      },
    };

    mockJobService = {
      getJobById: jest.fn(),
    };

    mockDataImportService = {
      dataFormatService: {
        getDynamicProvider: jest.fn().mockReturnValue({ metaEntityName: 'CaptureEvent' }),
      },
      findDataImportMapping: jest.fn(),
      rollbackImport: jest.fn().mockResolvedValue(null),
    };

    mockDataService = {
      metaEntityService: {
        findOne: jest.fn().mockResolvedValue({
          name: 'CaptureEvent',
          attributes: [],
        }),
      },
      getTreeParentAttribute: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataImportJobController],
      providers: [
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('sync') } },
        { provide: JobService, useValue: mockJobService },
        { provide: DataImportService, useValue: mockDataImportService },
        { provide: OrmService, useValue: mockOrmService },
        { provide: DataService, useValue: mockDataService },
      ],
    }).compile();

    controller = module.get<DataImportJobController>(DataImportJobController);
  });

  it('should throw NotFoundException if job does not exist', async () => {
    mockJobService.getJobById.mockResolvedValue(null);
    await expect(controller.rollbackJob('job-unknown')).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if job is already RolledBack', async () => {
    mockJobService.getJobById.mockResolvedValue({ id: 'job-1', status: 'RolledBack' });
    await expect(controller.rollbackJob('job-1')).rejects.toThrow(BadRequestException);
  });

  it('should delete entities in chunks of 100 within a transaction', async () => {
    // Generate 250 entity IDs
    const fakeIds = Array.from({ length: 250 }, (_, i) => `entity-${i + 1}`);
    mockJobService.getJobById.mockResolvedValue({
      id: 'job-1',
      status: 'Completed',
      data: JSON.stringify({
        dataFormat: 'CaptureEvent',
        importedEntityList: fakeIds,
        importResult: fakeIds.map(id => ({ actualEntity: { id } })),
      }),
    });

    const result = await controller.rollbackJob('job-1');

    expect(result.success).toBe(true);
    expect(result.status).toBe('RolledBack');

    // Should have chunked 250 into 3 calls: [100, 100, 50]
    expect(mockModel.destroy).toHaveBeenCalledTimes(3);
    expect(mockModel.destroy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: { [Op.in]: fakeIds.slice(0, 100) } },
        transaction: mockTransaction,
      })
    );
    expect(mockModel.destroy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: { [Op.in]: fakeIds.slice(100, 200) } },
        transaction: mockTransaction,
      })
    );
    expect(mockModel.destroy).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: { id: { [Op.in]: fakeIds.slice(200, 250) } },
        transaction: mockTransaction,
      })
    );

    // Associated locations should also be deleted
    expect(mockLocationModel.destroy).toHaveBeenCalled();

    // Transaction should be committed
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(mockTransaction.rollback).not.toHaveBeenCalled();

    // Job table updated
    expect(mockOrmService.sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE "Job"'),
      expect.objectContaining({
        transaction: mockTransaction,
      })
    );
  });

  it('should abort and rollback transaction if a chunk fails', async () => {
    const fakeIds = Array.from({ length: 150 }, (_, i) => `entity-${i + 1}`);
    mockJobService.getJobById.mockResolvedValue({
      id: 'job-1',
      status: 'Completed',
      data: JSON.stringify({
        dataFormat: 'CaptureEvent',
        importedEntityList: fakeIds,
      }),
    });

    mockModel.destroy.mockRejectedValueOnce(new Error('foreign key constraint violation'));

    await expect(controller.rollbackJob('job-1')).rejects.toThrow(ConflictException);

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });

  it('should use custom rollback provider when supported', async () => {
    mockJobService.getJobById.mockResolvedValue({
      id: 'job-1',
      status: 'Completed',
      data: JSON.stringify({
        dataFormat: 'CaptureEvent',
        importedEntityList: ['e-1', 'e-2'],
      }),
    });

    mockDataImportService.rollbackImport.mockResolvedValue({
      deletedCount: 2,
      message: 'Successfully rolled back 2 CaptureEvents',
    });

    const result = await controller.rollbackJob('job-1');

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(2);
    expect(result.message).toBe('Successfully rolled back 2 CaptureEvents');
    expect(mockDataImportService.rollbackImport).toHaveBeenCalledWith('job-1', expect.anything());
    // Generic fallback shouldn't run if custom provider handled it
    expect(mockModel.destroy).not.toHaveBeenCalled();
  });
});
