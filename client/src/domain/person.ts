
export class Person {

  public id?: string | null = null;
  public givenName?: string = '';
  public familyName?: string = '';
  public emailAddress?: string = '';
  public phoneNumber?: string = '';
  public birthday?: string = '';

  public getFullName() {
    return this.givenName + ' ' + this.familyName;
  }
}
