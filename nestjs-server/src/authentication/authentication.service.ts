import { Injectable } from '@nestjs/common';
import { LoginNotification } from './login-notification';
import { getKeyIdFromToken } from './jwt.strategy';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import * as jwksClient from 'jwks-rsa';
import { nativeJs, ZonedDateTime } from '@js-joda/core';
import { DataService } from '../data/data.service';
import { Entity } from '../domain/entity';

@Injectable()
export class AuthenticationService {
  private jwksClient;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly dataService: DataService,
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
    console.log(`idToken: ${loginNotification.idToken}`);
    console.log(`accessToken: ${loginNotification.accessToken}`);

    const idToken = await this.decodeAndVerify(loginNotification.idToken);
    const accessToken = await this.decodeAndVerify(
      loginNotification.accessToken,
    );

    const auth_time = ZonedDateTime.from(
      nativeJs(new Date(idToken.auth_time * 1000)),
    );

    console.log(
      `Login notification From: ${idToken.given_name} ${idToken.family_name}, ${idToken.email}, ${accessToken.username} - ${auth_time}`,
    );

    await this.dataService.save('Authentication', {
      id: null,
      auth_time: auth_time.toInstant().toString(),
      given_name: idToken.given_name,
      family_name: idToken.family_name,
      email_address: idToken.email, // subtle name change here!
      username: accessToken.username,
    } as Entity);

    return;
  }

  private async decodeAndVerify(token: string): Promise<any> {
    const kid = getKeyIdFromToken(token);
    const key = await this.jwksClient.getSigningKey(kid);
    return jwt.verify(token, key.getPublicKey());
  }
}
