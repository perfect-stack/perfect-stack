import { v4 } from 'uuid';
import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class Person extends Model {
  //public id?: string = v4();

  @Column
  public givenName?: string;

  @Column
  public familyName?: string;

  @Column
  public emailAddress: string;

  @Column
  public phoneNumber?: string;

  @Column
  public birthday?: string;

  @Column
  public gender?: 'male' | 'female';
}
