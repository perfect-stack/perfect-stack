import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'Person' })
export class Person {
  @PrimaryKey()
  id: string;

  @Property()
  given_name: string;

  @Property()
  family_name: string;

  @Property()
  email_address: string;
}
