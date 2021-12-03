import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity()
export class Person {
  @PrimaryKey()
  public id?: string = v4();

  @Property()
  public givenName?: string;

  @Property()
  public familyName?: string;

  @Property()
  public emailAddress: string;

  @Property({ nullable: true })
  public phoneNumber?: string;

  @Property({ nullable: true })
  public birthday?: string;

  @Property({ nullable: true })
  public gender?: 'male' | 'female';
}
