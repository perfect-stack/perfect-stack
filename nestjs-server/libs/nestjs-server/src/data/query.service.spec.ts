import { Test } from '@nestjs/testing';
import { QueryService } from './query.service';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { OrmService } from '../orm/orm.service';
import { AttributeType } from '../domain/meta.entity';

describe('QueryService.buildFindOneIncludes', () => {
  let queryService: QueryService;

  const models: Record<string, any> = {
    CaptureEvent: { name: 'CaptureEvent' },
    Location: { name: 'Location' },
    Activity: { name: 'Activity' },
    Assertion: { name: 'Assertion' },
    Protocol: { name: 'Protocol' },
  };

  const metaEntities: Record<string, any> = {
    CaptureEvent: {
      name: 'CaptureEvent',
      attributes: [
        { name: 'location', type: AttributeType.OneToOne, relationshipTarget: 'Location' },
        { name: 'parent_event', type: AttributeType.ManyToOne, relationshipTarget: 'CaptureEvent' },
        { name: 'sub_events', type: AttributeType.OneToMany, relationshipTarget: 'CaptureEvent' },
        { name: 'activities', type: AttributeType.OneToMany, relationshipTarget: 'Activity' },
      ],
    },
    Location: {
      name: 'Location',
      attributes: [],
    },
    Activity: {
      name: 'Activity',
      attributes: [
        { name: 'assertions', type: AttributeType.OneToMany, relationshipTarget: 'Assertion' },
      ],
    },
    Assertion: {
      name: 'Assertion',
      attributes: [
        { name: 'protocol', type: AttributeType.ManyToOne, relationshipTarget: 'Protocol' },
      ],
    },
    Protocol: {
      name: 'Protocol',
      attributes: [],
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        QueryService,
        {
          provide: MetaEntityService,
          useValue: {
            findOne: jest.fn((name: string) => Promise.resolve(metaEntities[name])),
          },
        },
        {
          provide: OrmService,
          useValue: {
            sequelize: {
              isDefined: jest.fn((name: string) => Boolean(models[name])),
              model: jest.fn((name: string) => models[name]),
            },
          },
        },
      ],
    }).compile();

    queryService = moduleRef.get(QueryService);
  });

  it('adds separate: true on OneToMany includes but not on OneToOne or ManyToOne', async () => {
    const includes = await queryService.buildFindOneIncludes('CaptureEvent');

    const locationInclude = includes.find((i) => i.as === 'location');
    expect(locationInclude).toEqual({
      model: models.Location,
      as: 'location',
      required: false,
    });
    expect(locationInclude.separate).toBeUndefined();

    const parentInclude = includes.find((i) => i.as === 'parent_event');
    expect(parentInclude).toEqual({
      model: models.CaptureEvent,
      as: 'parent_event',
      required: false,
    });
    expect(parentInclude.separate).toBeUndefined();

    const selfOneToManyInclude = includes.find((i) => i.as === 'sub_events');
    expect(selfOneToManyInclude).toEqual({
      model: models.CaptureEvent,
      as: 'sub_events',
      required: false,
      separate: true,
    });

    const activitiesInclude = includes.find((i) => i.as === 'activities');
    expect(activitiesInclude).toEqual({
      model: models.Activity,
      as: 'activities',
      required: false,
      separate: true,
      include: [
        {
          model: models.Assertion,
          as: 'assertions',
          required: false,
          separate: true,
          include: [
            {
              model: models.Protocol,
              as: 'protocol',
              required: false,
            },
          ],
        },
      ],
    });
  });
});
