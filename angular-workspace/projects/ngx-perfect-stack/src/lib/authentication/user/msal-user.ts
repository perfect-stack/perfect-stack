import { User } from './user';
import { NgxPerfectStackConfig } from '../../ngx-perfect-stack-config';
import { AccountInfo } from '@azure/msal-browser';

export class MsalUser implements User {
  name: string | undefined;
  username: string;
  groups: string[] = [];

  constructor(
    public account: AccountInfo,
    protected readonly stackConfig: NgxPerfectStackConfig
  ) {
    this.initFromAccount(account);
  }

  initFromAccount(account: AccountInfo): void {
    this.account = account;
    this.name = account.name;
    this.username = account.username;

    if (account.idTokenClaims) {
      // In Azure AD, App Roles are exposed in the 'roles' claim.
      // Security groups can be exposed in the 'groups' claim, but requires specific configuration.
      const roles = (account.idTokenClaims['roles'] as string[]) || [];

      // For MSAL we map across the "roles" as "groups"
      this.groups = [...roles];
    } else {
      this.groups = [];
    }

    // Add supplementary roles for local dev purposes, similar to CognitoUser.
    if (this.stackConfig.supplementaryGroupRoles) {
      const supplementaryGroupRoles = this.stackConfig.supplementaryGroupRoles.split(',');
      this.groups.push(...supplementaryGroupRoles);
    }
  }

  /**
   * Returns the ID token from the MSAL account.
   */
  getBearerToken(): string | null {
    return this.account.idToken ?? null;
  }

  getGroups(): string[] {
    return this.groups;
  }

  logout(): void {
    // Logout is handled by MsalService
  }
}
