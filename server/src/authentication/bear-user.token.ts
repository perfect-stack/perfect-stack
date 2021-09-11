import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

export interface BearUserToken {
  accountData: AccountUserSummary[];
  sub: string;
  userRole: string;
}

export interface AccountUserSummary {
  accountId: string;
  accountRole: string;
}

/**
 * Functional class that wraps around BearUserToken to supply common useful functions.
 */
export class BearUserClass {
  token: BearUserToken;
  accountIdList: string[] = null;

  constructor(token: BearUserToken) {
    this.token = token;
  }

  isNotSuperAdmin() {
    return this.token.userRole !== 'SuperAdmin';
  }

  isSuperAdmin() {
    return this.token.userRole === 'SuperAdmin';
  }

  getAccountIdList() {
    if (!this.accountIdList) {
      this.accountIdList = [];
      for (const accountUserSummary of this.token.accountData) {
        if (accountUserSummary.accountRole === 'Admin') {
          this.accountIdList.push(accountUserSummary.accountId);
        }
      }
    }
    return this.accountIdList;
  }

  assertAccountId(accountId: string) {
    this.assert(
      this.isSuperAdmin() || this.getAccountIdList().includes(accountId),
    );
  }

  assert(ok: boolean) {
    if (!ok) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }
}

/**
 * Decorator for parameter injection e.g someMethod(@BearUser() user)
 */
export const BearUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return new BearUserClass(request.user);
  },
);
