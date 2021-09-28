import { Transform, Type } from 'class-transformer';
import { LocalDate } from '@js-joda/core';

export class Person {
  public id?: string;
  public givenName?: string;
  public familyName?: string;
  public emailAddress: string;
  public phoneNumber?: string;

  @Transform(({ value }) => LocalDate.parse(value), { toClassOnly: true })
  public birthday?: LocalDate;
}
