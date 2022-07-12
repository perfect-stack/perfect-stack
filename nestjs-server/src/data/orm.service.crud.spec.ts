import { Test } from '@nestjs/testing';
import { OrmModule } from '../orm/orm.module';
import { CONFIG_MODULE } from '../app.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { v4 as uuidv4 } from 'uuid';
import { OrmService } from '../orm/orm.service';

describe('DataService-CRUD', () => {
  let ormService: OrmService;
  let metaEntityService: MetaEntityService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CONFIG_MODULE, MetaEntityModule, OrmModule],
      providers: [],
    }).compile();

    ormService = moduleRef.get(OrmService);
    metaEntityService = moduleRef.get(MetaEntityService);

    await metaEntityService.syncMetaModelWithDatabase(false);
  });

  it('should be defined', () => {
    expect(ormService).toBeDefined();
  });

  it('should CRUD a Person', async () => {
    // Create a brand-new entity with an associated child
    const person1 = {
      id: uuidv4(),
      given_name: 'Test-A2',
      family_name: 'Name' + Date.now(),
      physical_address: null,
      phone_numbers: [],
    };

    // physical_address: {
    //   street_address: '123 Somewhere Street',
    // },

    // // update with some more children and no id needed
    // person1.phone_numbers = [
    //   {
    //     type: 'mobile',
    //     country: '+64',
    //     number: '123 5678',
    //   },
    //   // {
    //   //   type: 'home',
    //   //   country: '+64',
    //   //   number: '333 5678',
    //   // },
    // ];

    const personModel = ormService.sequelize.model('Person');
    const person: any = await personModel.create(person1);

    const phoneModel = ormService.sequelize.model('PhoneNumber');
    const phone1: any = await phoneModel.create({
      id: uuidv4(),
      type: 'mobile',
      country: '+64',
      number: '123 5678',
    });

    await person.addPhone_numbers(phone1);

    const phone2: any = await phoneModel.create({
      id: uuidv4(),
      type: 'mobile',
      country: '+64',
      number: '222 5678',
    });

    await person.addPhone_numbers(phone2);

    const person2: any = await personModel.findByPk(person1.id, {
      include: { all: true, nested: true },
    });

    const person2Entity = person2.toJSON();

    console.log(`person2 = ${JSON.stringify(person2Entity)}`);
    expect(person2Entity.phone_numbers.length).toEqual(2);

    //p.save();
  }, 120000);
});
