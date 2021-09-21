import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');

/**
 * Had to write all of this as functions, because I didn't know how to inject a function from a service
 * into the Passport strategy without it losing access to "this" - see "secretOrKeyProvider" in the
 * constructor below
 */
const jwtKeys = {};

async function getJwtKey(keyId: string): Promise<string> {
  let keyValue = jwtKeys[keyId];
  if (!keyValue) {
    const httpResponse = await axios.get(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
    );
    const googleKeys = httpResponse.data;
    console.log(`Got ${Object.keys(googleKeys).length} JWT keys from Google`);

    for (const gid of Object.keys(googleKeys)) {
      jwtKeys[gid] = googleKeys[gid];
    }

    keyValue = jwtKeys[keyId];
    if (!keyValue) {
      console.error('Unable to find JWT public key for; ' + keyId);
    }
  }
  return keyValue;
}

function getKeyIdFromToken(rawJwtToken: string): string {
  const tokenElements = rawJwtToken.split('.');
  const header = JSON.parse(
    Buffer.from(tokenElements[0], 'base64').toString('utf8'),
  );
  return header['kid'];
}

async function secretOrKeyProvider(request, rawJwtToken, done) {
  const keyId = getKeyIdFromToken(rawJwtToken);
  const keyValue = await getJwtKey(keyId);
  done(null, keyValue);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('jwt'),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: secretOrKeyProvider,
    });
  }

  async validate(payload: any) {
    // Uncomment the following line for a quick easy way of seeing the JWT payload in clear text (which is safe)
    // without having to muck about grabbing the Base64 encoded version and decoding that
    // console.log(`validate token: ${JSON.stringify(payload)}`);

    const issuer = payload.iss;
    if (issuer === 'https://securetoken.google.com/perfect-stack-demo') {
      return payload;
    } else {
      throw new UnauthorizedException();
    }
  }
}
