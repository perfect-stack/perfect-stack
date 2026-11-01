import { MsalUser } from './msal-user';
import { AccountInfo } from '@azure/msal-browser';
import { NgxPerfectStackConfig } from '../../ngx-perfect-stack-config';

describe('MsalUser', () => {
  const baseConfig: NgxPerfectStackConfig = {
    apiUrl: 'http://localhost:3080/api',
    authenticationProvider: 'MSAL',
    cognitoLoginUrl: '',
    clientRelease: 'DEV',
    dateFormat: 'dd/MM/yyyy',
    dateTimeFormat: 'dd/MM/yyyy HH:mm:ss',
    timeFormat: 'HH:mm:ss',
    debug: false,
    metaRoleList: [],
    supportEmail: '',
    showMenuLoginBtn: true,
    copyrightFooter: '',
    dataSourceEditable: false,
    environmentBannerText: 'DEV',
    supplementaryGroupRoles: '',
    msalClientId: 'test-client',
    msalAuthority: 'https://login.microsoftonline.com/tenant',
    msalRedirectUri: 'http://localhost:4200/login-callback',
  };

  it('should initialize correctly from standard MS Entra workforce account', () => {
    const account: AccountInfo = {
      homeAccountId: 'home-1',
      environment: 'login.microsoftonline.com',
      tenantId: 'tenant-1',
      username: 'jane.doe@doc.govt.nz',
      localAccountId: 'local-1',
      name: 'Jane Doe',
      idToken: 'token-abc',
      idTokenClaims: {
        roles: ['carmon-admin', 'carmon-user'],
        preferred_username: 'jane.doe@doc.govt.nz',
      },
    };

    const user = new MsalUser(account, baseConfig);
    expect(user.name).toBe('Jane Doe');
    expect(user.username).toBe('jane.doe@doc.govt.nz');
    expect(user.getGroups()).toEqual(['carmon-admin', 'carmon-user']);
    expect(user.getBearerToken()).toBe('token-abc');
  });

  it('should initialize correctly from External ID account with email fallback and extension_Role', () => {
    const account: AccountInfo = {
      homeAccountId: 'home-2',
      environment: 'mytenant.ciamlogin.com',
      tenantId: 'tenant-2',
      username: '', // External ID may leave account.username blank
      localAccountId: 'local-2',
      name: 'External Contractor',
      idToken: 'token-xyz',
      idTokenClaims: {
        email: 'contractor@example.com',
        extension_Role: 'carmon-contractor',
      },
    };

    const user = new MsalUser(account, baseConfig);
    expect(user.name).toBe('External Contractor');
    expect(user.username).toBe('contractor@example.com');
    expect(user.getGroups()).toEqual(['carmon-contractor']);
    expect(user.getBearerToken()).toBe('token-xyz');
  });
});
