import { DataService } from './data.service';
import { DataModule } from './data.module';
import { Test } from '@nestjs/testing';
import { OrmModule } from '../orm/orm.module';
import { CONFIG_MODULE } from '../app.module';
import { Entity } from '../domain/entity';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { v4 as uuidv4 } from 'uuid';
import { QueryService } from './query.service';

describe('DataService-CRUD', () => {
  let dataService: DataService;
  let queryService: QueryService;
  let metaEntityService: MetaEntityService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CONFIG_MODULE, DataModule, MetaEntityModule, OrmModule],
      providers: [DataService],
    }).compile();

    dataService = moduleRef.get(DataService);
    metaEntityService = moduleRef.get(MetaEntityService);

    await metaEntityService.syncMetaModelWithDatabase(false);
  });

  it('should be defined', () => {
    expect(dataService).toBeDefined();
  });

  it('should CRUD a Person', async () => {
    // Create a brand-new entity with an associated child
    const person1 = {
      //      id: uuidv4(),
      given_name: 'Test',
      family_name: 'Name' + Date.now(),
      physical_address: {
        street_address: '123 Somewhere Street',
      },
    };

    const person2EntityResponse = await dataService.save(
      'Person',
      person1 as unknown as Entity,
    );

    // extract the id from the result of the create request
    const personId = person2EntityResponse.entity.id;

    // now find the entity, expecting eager loading of all children
    const person3 = (await queryService.findOne('Person', personId)) as any;

    expect(personId).toEqual(person3.id);
    expect(person1.family_name).toEqual(person3.family_name);
    expect(person3.physical_address.street_address).toEqual(
      '123 Somewhere Street',
    );

    // update with some more children and no id needed
    person3.phone_numbers = [
      {
        type: 'mobile',
        country: '+64',
        number: '123 5678',
      },
    ];

    const person4EntityResponse = await dataService.save('Person', person3);
    const person5 = (await queryService.findOne('Person', personId)) as any;
    expect(personId).toEqual(person5.id);
    expect(person5.physical_address.street_address).toEqual(
      '123 Somewhere Street',
    );
    expect(person5.phone_numbers[0].number).toEqual('123 5678');
  }, 120000);
});
