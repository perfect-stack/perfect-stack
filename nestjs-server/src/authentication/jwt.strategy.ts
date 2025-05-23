import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');

/**
 * Had to write all of this as functions, because I didn't know how to inject a function from a service
 * into the Passport strategy without it losing access to "this" - see "secretOrKeyProvider" in the
 * constructor below
 */
const jwtKeys = {};
const jwtLogger = new Logger('JWTFunctions');

async function getCognitoKeys(keyMap: any) {
  const keyList = keyMap['keys'];
  for (const nextKey of keyList) {
    jwtKeys[nextKey['kid']] = nextKey;
  }
}

async function getJwtKey(
  keyId: string,
  configService: ConfigService,
): Promise<string> {
  let keyValue = jwtKeys[keyId];
  if (!keyValue) {
    const publicKeyUrl = configService.get('AUTHENTICATION_PUBLIC_KEY_URL');
    const httpResponse = await axios.get(publicKeyUrl);
    const rawKeys = httpResponse.data;

    jwtLogger.warn(`Got JWT keys from ${publicKeyUrl}`);

    const authenticationProvider = configService.get('AUTHENTICATION_PROVIDER');
    switch (authenticationProvider) {
      case 'COGNITO':
        await getCognitoKeys(rawKeys);
        break;
      default:
        throw new Error(
          `Unknown authentication provider: ${authenticationProvider}`,
        );
    }
  }

  keyValue = jwtKeys[keyId];
  if (!keyValue) {
    jwtLogger.error(
      `Unable to find JWT public key for; ${keyId} jwtKeys = ${JSON.stringify(
        jwtKeys,
      )}`,
    );
  }

  return keyValue;
}

export function getKeyIdFromToken(rawJwtToken: string): string {
  const tokenElements = rawJwtToken.split('.');
  const header = JSON.parse(Buffer.from(tokenElements[0], 'base64').toString('utf8'));
  return header['kid'];
}

function getCognitoKeyProvider(configService: ConfigService) {
  const publicKeyUrl = configService.get('AUTHENTICATION_PUBLIC_KEY_URL');
  if (publicKeyUrl) {
    return passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: publicKeyUrl,
    });
  } else {
    throw new Error(`AUTHENTICATION_PUBLIC_KEY_URL has not been provided`);
  }
}

function getKeyProvider(configService: ConfigService) {
  const authenticationProvider = configService.get('AUTHENTICATION_PROVIDER');
  switch (authenticationProvider) {
    case 'COGNITO':
      return getCognitoKeyProvider(configService);
    default:
      throw new Error(
        `Unknown AUTHENTICATION_PROVIDER of ${authenticationProvider}`,
      );
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  readonly expectedIssuer = this.configService.get('AUTHENTICATION_ISSUER');

  constructor(protected readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // If available as a Bearer token then use that
        ExtractJwt.fromUrlQueryParameter('jwt'), // Else look for a query parameter called jwt
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: getKeyProvider(configService),
    });
  }

  getCognitoGroups(payload: any): string[] {
    return payload['cognito:groups'];
  }

  /**
   * The Azure AD groups appear in the token with the following format;
   *
   * "custom:group": "[KIMS_Viewer, KIMS_Business_Admin, KIMS_Project_Manager, KIMS_Operations, KIMS_Editor]"
   * @param payload
   */
  getCustomGroups(payload: any): string[] {
    const customGroupsStr = payload['custom:group'];
    if (customGroupsStr) {
      const tokens = customGroupsStr.replace(/[\[\]]/g, '');
      const tokenList = tokens.split(',');
      return tokenList.map((s) => s.trim());
    } else {
      return [];
    }
  }

  async validate(payload: any) {
    // Uncomment the following line for a quick easy way of seeing the JWT payload in clear text (which is safe)
    // without having to muck about grabbing the Base64 encoded version and decoding that
    //jwtLogger.log(`PASSPORT: validate token: ${JSON.stringify(payload)}`);

    const issuerValid = payload.iss === this.expectedIssuer;
    if (issuerValid) {
      const userDataStructure = {
        groups: [
          ...this.getCognitoGroups(payload),
          ...this.getCustomGroups(payload),
        ],
        username: payload['cognito:username'],
        given_name: payload['given_name'],
        family_name: payload['family_name'],
        email: payload['email'],
      };
      //jwtLogger.log('PASSPORT: userDataStructure: ', userDataStructure);
      return userDataStructure;
    }
    else {
      jwtLogger.error(`Invalid token, issuerValue = ${issuerValid}, for: ${JSON.stringify(payload)}`);
      throw new UnauthorizedException();
    }
  }
}
