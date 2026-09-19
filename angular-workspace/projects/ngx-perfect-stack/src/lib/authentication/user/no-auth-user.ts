import { User } from './user';

export class NoAuthUser implements User {
  given_name = 'Dev';
  family_name = 'User';
  email_address = 'dev@local.test';

  logout(): void {}

  getGroups(): string[] {
    return ['Administrator'];
  }

  getBearerToken(): string | null {
    return 'dev-test-token';
  }
}
