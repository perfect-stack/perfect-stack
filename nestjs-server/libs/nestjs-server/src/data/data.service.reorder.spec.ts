import { Test } from '@nestjs/testing';
import { DataService } from './data.service';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { OrmService } from '../orm/orm.service';
import { QueryService } from './query.service';
import { EventService } from '../event/event.service';
import { DiscriminatorService } from './discriminator.service';
import { MediaRepositoryService } from '../media/media-repository.service';
import { ValidationService } from './validation.service';
import { AttributeType } from '../domain/meta.entity';

describe('DataService.reorder', () => {
  let dataService: DataService;
  let metaEntityService: Partial<MetaEntityService>;
  let ormService: any;
  let mockModel: any;
  let mockTransaction: any;

  beforeEach(async () => {
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    mockModel = {
      update: jest.fn().mockResolvedValue([1]),
    };

    ormService = {
      sequelize: {
        transaction: jest.fn().mockResolvedValue(mockTransaction),
        model: jest.fn().mockReturnValue(mockModel),
      },
    };

    metaEntityService = {
      findOne: jest.fn().mockResolvedValue({
        name: 'Item',
        attributes: [
          { name: 'id', type: AttributeType.Identifier },
          { name: 'sort_index', type: AttributeType.Integer },
        ],
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DataService,
        { provide: MetaEntityService, useValue: metaEntityService },
        { provide: OrmService, useValue: ormService },
        { provide: QueryService, useValue: {} },
        { provide: EventService, useValue: {} },
        { provide: DiscriminatorService, useValue: {} },
        { provide: MediaRepositoryService, useValue: {} },
        { provide: ValidationService, useValue: {} },
      ],
    }).compile();

    dataService = moduleRef.get(DataService);
  });

  it('should update each entity with sequential sort_index inside a transaction', async () => {
    const ids = ['id-1', 'id-2', 'id-3'];
    await dataService.reorder('Item', ids);

    expect(ormService.sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(mockModel.update).toHaveBeenCalledTimes(3);
    expect(mockModel.update).toHaveBeenNthCalledWith(
      1,
      { sort_index: 0 },
      { where: { id: 'id-1' }, transaction: mockTransaction },
    );
    expect(mockModel.update).toHaveBeenNthCalledWith(
      2,
      { sort_index: 1 },
      { where: { id: 'id-2' }, transaction: mockTransaction },
    );
    expect(mockModel.update).toHaveBeenNthCalledWith(
      3,
      { sort_index: 2 },
      { where: { id: 'id-3' }, transaction: mockTransaction },
    );
    expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
  });

  it('should rollback transaction if an update fails', async () => {
    mockModel.update.mockRejectedValueOnce(new Error('DB failure'));

    await expect(dataService.reorder('Item', ['id-1'])).rejects.toThrow(
      'DB failure',
    );

    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });
});
