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

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  private jwksClient;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly dataService: DataService,
    protected readonly queryService: QueryService,
  ) {
    this.jwksClient = jwksClient({
      jwksUri: configService.get('AUTHENTICATION_PUBLIC_KEY_URL'),
    });
  }

  /**
   * Receive login notification data from the client when someone has successfully logged in. This is for informational
   * purposes only. It has no bearing on how login sessions are handled. The token will be checked for validility to
   * confirm that the user is not attempting to impersonate another user logging in but again since it's informational
   * only there is the possibility that someone does a login but then prevents this method being called. The one true
   * source of authentication is Cognito and AzureAD logs themselves.
   */
  async notification(loginNotification: LoginNotification) {
    // console.log(`idToken: ${loginNotification.idToken}`);
    // console.log(`accessToken: ${loginNotification.accessToken}`);

    const idToken = await this.decodeAndVerify(loginNotification.idToken);
    const accessToken = await this.decodeAndVerify(
      loginNotification.accessToken,
    );

    const auth_time = ZonedDateTime.from(
      nativeJs(new Date(idToken.auth_time * 1000)),
    );

    this.logger.log(
      `Login notification, saving... ${idToken.given_name} ${idToken.family_name}, ${idToken.email}, ${accessToken.username} - ${auth_time}`,
    );

    this.logger.log(`Login notification, save with transaction`);
    await this.dataService.save('Authentication', {
      id: null,
      auth_time: auth_time.toInstant().toString(),
      given_name: idToken.given_name,
      family_name: idToken.family_name,
      email_address: idToken.email, // subtle name change here!
      username: accessToken.username,
    } as Entity);

    // this.logger.log(`Login notification, bypass transaction and save directly`)
    // await this.dataService.saveInTransaction('Authentication', {
    //   id: null,
    //   auth_time: auth_time.toInstant().toString(),
    //   given_name: idToken.given_name,
    //   family_name: idToken.family_name,
    //   email_address: idToken.email, // subtle name change here!
    //   username: accessToken.username,
    // } as Entity);

    this.logger.log(
      `Login notification Saved ok: ${idToken.given_name} ${idToken.family_name}, ${idToken.email}, ${accessToken.username} - ${auth_time}`,
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
