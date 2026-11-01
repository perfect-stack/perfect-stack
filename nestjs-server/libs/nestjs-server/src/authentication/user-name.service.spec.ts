import { UserNameService } from './user-name.service';

describe('UserNameService', () => {
  let service: UserNameService;

  beforeEach(() => {
    service = new UserNameService();
  });

  it('should return username when present', () => {
    expect(service.getUsername({ username: 'testuser' })).toBe('testuser');
  });

  it('should return cognito:username when username is absent', () => {
    expect(service.getUsername({ 'cognito:username': 'cognito_user' })).toBe('cognito_user');
  });

  it('should return email when username is absent (External ID)', () => {
    expect(service.getUsername({ email: 'external.contractor@gmail.com' })).toBe('external.contractor@gmail.com');
  });

  it('should return preferred_username when username and email are absent', () => {
    expect(service.getUsername({ preferred_username: 'ext_pref_user' })).toBe('ext_pref_user');
  });

  it('should return Unknown when no identifying claims exist', () => {
    expect(service.getUsername({})).toBe('Unknown');
  });
});
