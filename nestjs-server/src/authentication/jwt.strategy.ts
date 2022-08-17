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

async function getFirebaseKeys(keyMap: any) {
  for (const kid of Object.keys(keyMap)) {
    jwtKeys[kid] = keyMap[kid];
  }
}

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

    jwtLogger.log(`Got JWT keys from ${publicKeyUrl}`);

    const authenticationProvider = configService.get('AUTHENTICATION_PROVIDER');
    switch (authenticationProvider) {
      case 'FIREBASE':
        await getFirebaseKeys(rawKeys);
        break;
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
  const header = JSON.parse(
    Buffer.from(tokenElements[0], 'base64').toString('utf8'),
  );
  return header['kid'];
}

function getFirebaseKeyProvider(configService: ConfigService) {
  return async (request, rawJwtToken, done) => {
    const keyId = getKeyIdFromToken(rawJwtToken);
    const keyValue = await getJwtKey(keyId, configService);
    done(null, keyValue);
  };
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
    case 'FIREBASE':
      return getFirebaseKeyProvider(configService);
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

  async validate(payload: any) {
    // Uncomment the following line for a quick easy way of seeing the JWT payload in clear text (which is safe)
    // without having to muck about grabbing the Base64 encoded version and decoding that
    // console.log(`validate token: ${JSON.stringify(payload)}`);

    const issuerValid = payload.iss === this.expectedIssuer;
    if (issuerValid) {
      return payload;
    } else {
      jwtLogger.error(
        `Invalid token, issuerValue = ${issuerValid}, for: ${JSON.stringify(
          payload,
        )}`,
      );
      throw new UnauthorizedException();
    }
  }
}
