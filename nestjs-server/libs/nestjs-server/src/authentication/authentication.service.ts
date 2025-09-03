import { Injectable, Logger } from '@nestjs/common';
import { LoginNotification } from './login-notification';
import { getKeyIdFromToken } from './jwt.strategy';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import * as jwksClient from 'jwks-rsa';
import { nativeJs, ZonedDateTime } from '@js-joda/core';
import { DataService } from '../data/data.service';
import { Entity } from '../domain/entity';
import { QueryService } from '../data/query.service';
import { QueryRequest } from '../data/query.request';
import { AttributeType, ComparisonOperator } from '../domain/meta.entity';
import { UserNameService } from './user-name.service';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  private jwksClient;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly dataService: DataService,
    protected readonly queryService: QueryService,
    protected readonly userNameService: UserNameService,
  ) {
    this.jwksClient = jwksClient({
      jwksUri: configService.get('AUTHENTICATION_PUBLIC_KEY_URL'),
    });
  }

  /**
   * Receive login notification data from the client when someone has successfully logged in. This is for informational
   * purposes only. It has no bearing on how login sessions are handled. The token will be checked for validity to
   * confirm that the user is not attempting to impersonate another user logging in but again since it's informational
   * only there is the possibility that someone does a login but then prevents this method being called. The one true
   * source of authentication is Cognito and AzureAD logs themselves.
   */
  async notification(loginNotification: LoginNotification) {
    const bearerToken = await this.decodeAndVerify(
      loginNotification.bearerToken,
    );

    const auth_time = ZonedDateTime.from(
      nativeJs(new Date(bearerToken.auth_time * 1000)),
    );

    const username = this.userNameService.getUsername(bearerToken);
    this.logger.log(
      `Login notification, saving... ${bearerToken.given_name} ${bearerToken.family_name}, ${bearerToken.email}, ${username} - ${auth_time}`,
    );

    await this.dataService.save('Authentication', {
      id: null,
      auth_time: auth_time.toInstant().toString(),
      given_name: bearerToken.given_name,
      family_name: bearerToken.family_name,
      email_address: bearerToken.email, // subtle name change here!
      username: username,
    } as Entity);

    this.logger.log(
      `Login notification Saved ok: ${bearerToken.given_name} ${bearerToken.family_name}, ${bearerToken.email}, ${username} - ${auth_time}`,
    );

    return;
  }

  private async decodeAndVerify(token: string): Promise<any> {
    const kid = getKeyIdFromToken(token);
    const key = await this.jwksClient.getSigningKey(kid);
    return jwt.verify(token, key.getPublicKey());
  }

  public async findLastSignIn(username: string): Promise<any> {
    let result = null;
    if (username) {
      const qr = new QueryRequest();
      qr.criteria.push({
        name: 'email_address',
        value: username,
        operator: ComparisonOperator.Equals,
        attributeType: AttributeType.Text,
      });

      qr.metaEntityName = 'Authentication';
      qr.orderByName = 'auth_time';
      qr.orderByDir = 'DESC';
      qr.pageNumber = 1;
      qr.pageSize = 1;

      const response = await this.queryService.findByCriteria(qr);

      if (response.totalCount > 0) {
        result = response.resultList[0];
      }
    }

    return result;
  }
}
