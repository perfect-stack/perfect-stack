import { User } from './user';
import { NgxPerfectStackConfig } from '../../ngx-perfect-stack-config';
import { AccountInfo } from '@azure/msal-browser';

export class MsalUser implements User {
  name: string | undefined;
  username: string;
  groups: string[] = [];

  constructor(
    protected readonly account: AccountInfo,
    protected readonly stackConfig: NgxPerfectStackConfig
  ) {
    this.name = account.name;
    this.username = account.username;

    if (account.idTokenClaims) {
      // In Azure AD, App Roles are exposed in the 'roles' claim.
      // Security groups can be exposed in the 'groups' claim, but requires specific configuration.
      const roles = (account.idTokenClaims['roles'] as string[]) || [];
      const groupsClaim = (account.idTokenClaims['groups'] as string[]) || [];
      this.groups = [...roles, ...groupsClaim];
    }

    // Add supplementary roles for local dev purposes, similar to CognitoUser.
    if (this.stackConfig.supplementaryGroupRoles) {
      const supplementaryGroupRoles = this.stackConfig.supplementaryGroupRoles.split(',');
      this.groups.push(...supplementaryGroupRoles);
    }
  }

  /**
   * Returns the ID token from the MSAL account.
   * NOTE: For authorizing API calls, you should acquire an ACCESS token silently, not use the ID token.
   * This is implemented to mirror the existing CognitoUser behavior.
   */
  getBearerToken(): string | null {
    return this.account.idToken ?? null;
  }

  getGroups(): string[] {
    return this.groups;
  }

  /**
   * The MsalService handles the actual logout process, including clearing cached tokens.
   * This method is implemented to satisfy the User interface contract.
   */
  logout(): void {
    // Logout is handled by MsalService.logoutRedirect() or logoutPopup().
    // No action is required here.
  }
}
