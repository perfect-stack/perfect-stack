
export class Person {

  public id?: string | null = null;
  public given_name?: string = '';
  public family_name?: string = '';
  public email_address?: string = '';
  public phone_number?: string = '';
  public birthday?: string = '';

  public getFullName() {
    return this.given_name + ' ' + this.family_name;
  }
}
