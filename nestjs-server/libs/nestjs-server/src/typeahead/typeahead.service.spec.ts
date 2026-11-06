import { Test, TestingModule } from '@nestjs/testing';
import { TypeaheadService } from './typeahead.service';
import { OrmService } from '../orm/orm.service';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { TypeaheadRequest } from './dto/typeahead.request';
import { MetaAttribute } from '../domain/meta.entity';

describe('TypeaheadService', () => {
  let service: TypeaheadService;
  let ormServiceMock: any;
  let metaEntityServiceMock: any;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'item-1',
          first_name: 'One',
          last_name: 'Two Three',
        },
      ]),
    };

    ormServiceMock = {
      sequelize: {
        query: jest.fn().mockResolvedValue([{ id: 'item-1' }]),
        model: jest.fn().mockReturnValue(mockModel),
      },
    };

    metaEntityServiceMock = {
      findOne: jest.fn().mockResolvedValue({
        name: 'Person',
        attributes: [
          {
            name: 'person_id',
            relationshipTarget: 'Person',
            typeaheadSearch: ['first_name', 'last_name'],
          } as unknown as MetaAttribute,
        ],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeaheadService,
        { provide: OrmService, useValue: ormServiceMock },
        { provide: MetaEntityService, useValue: metaEntityServiceMock },
      ],
    }).compile();

    service = module.get<TypeaheadService>(TypeaheadService);
  });

  it('should split searchText with spaces into tokens and construct searchValue in order', async () => {
    const request: TypeaheadRequest = {
      metaEntityName: 'Person',
      metaAttribute: {
        name: 'person_id',
        typeaheadSearch: ['first_name', 'last_name'],
      } as MetaAttribute,
      searchText: 'One Two',
      searchId: null,
      searchIdList: null,
    };

    const results = await service.search(request);

    expect(ormServiceMock.sequelize.query).toHaveBeenCalledWith(
      'Select id from "Person" where concat(first_name, \' \', last_name) ilike :searchValue',
      {
        replacements: { searchValue: '%One%Two%' },
        type: expect.anything(),
      },
    );

    expect(results).toEqual([
      {
        id: 'item-1',
        displayText: 'One Two Three',
      },
    ]);
  });

  it('should handle multiple consecutive and surrounding spaces cleanly', async () => {
    const request: TypeaheadRequest = {
      metaEntityName: 'Person',
      metaAttribute: {
        name: 'person_id',
        typeaheadSearch: ['first_name', 'last_name'],
      } as MetaAttribute,
      searchText: '   One    Two   ',
      searchId: null,
      searchIdList: null,
    };

    await service.search(request);

    expect(ormServiceMock.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      {
        replacements: { searchValue: '%One%Two%' },
        type: expect.anything(),
      },
    );
  });

  it('should handle three or more tokens preserving order', async () => {
    const request: TypeaheadRequest = {
      metaEntityName: 'Person',
      metaAttribute: {
        name: 'person_id',
        typeaheadSearch: ['first_name', 'last_name'],
      } as MetaAttribute,
      searchText: 'One Two Three',
      searchId: null,
      searchIdList: null,
    };

    await service.search(request);

    expect(ormServiceMock.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      {
        replacements: { searchValue: '%One%Two%Three%' },
        type: expect.anything(),
      },
    );
  });

  it('should handle single word searchText without extra wildcards', async () => {
    const request: TypeaheadRequest = {
      metaEntityName: 'Person',
      metaAttribute: {
        name: 'person_id',
        typeaheadSearch: ['first_name', 'last_name'],
      } as MetaAttribute,
      searchText: 'One',
      searchId: null,
      searchIdList: null,
    };

    await service.search(request);

    expect(ormServiceMock.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      {
        replacements: { searchValue: '%One%' },
        type: expect.anything(),
      },
    );
  });
});
