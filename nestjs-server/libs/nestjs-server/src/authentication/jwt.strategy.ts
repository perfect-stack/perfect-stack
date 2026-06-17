import {ExtractJwt, Strategy} from 'passport-jwt';
import {PassportStrategy} from '@nestjs/passport';
import {Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {passportJwtSecret} from 'jwks-rsa';
import {JwtPayload} from 'jsonwebtoken';

const jwtLogger = new Logger('JwtStrategy');

function getKeyProvider(configService: ConfigService) {
  const cognitoKeyProvider = passportJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: configService.get('COGNITO_AUTHENTICATION_PUBLIC_KEY_URL'),
  });

  const msalKeyProvider = passportJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: configService.get('MSAL_AUTHENTICATION_PUBLIC_KEY_URL'),
  });

  return (req, rawJwtToken, done) => {
    const decodedToken = JSON.parse(Buffer.from(rawJwtToken.split('.')[1], 'base64').toString('utf8'));
    const issuer = decodedToken.iss;
    const isMsalIssuer = issuer.startsWith('https://login.microsoftonline.com/') || issuer.startsWith('https://sts.windows.net/');

    if (issuer === configService.get('COGNITO_AUTHENTICATION_ISSUER')) {
      cognitoKeyProvider(req, rawJwtToken, done);
    } else if (isMsalIssuer) {
      msalKeyProvider(req, rawJwtToken, done);
    } else {
      done(new UnauthorizedException('Unknown token issuer'), null);
    }
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(protected readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('jwt'),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: getKeyProvider(configService),
    });
  }

  getCognitoGroups(payload: any): string[] {
    return payload['cognito:groups'] || [];
  }

  getMsalGroups(payload: any): string[] {
    // In MSAL we map across the "roles" into "groups" intentionally
    return payload['roles'] || [];
  }

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

  async validate(payload: JwtPayload) {
    jwtLogger.log(`Validating token for issuer: ${payload.iss}`);

    let userDataStructure;
    const isMsalIssuer = payload.iss.startsWith('https://login.microsoftonline.com/') || payload.iss.startsWith('https://sts.windows.net/');

    if (payload.iss === this.configService.get('COGNITO_AUTHENTICATION_ISSUER')) {
      userDataStructure = {
        groups: [
          ...this.getCognitoGroups(payload),
          ...this.getCustomGroups(payload),
        ],
        username: payload['cognito:username'],
        given_name: payload['given_name'],
        family_name: payload['family_name'],
        email: payload['email'],
      };
    } else if (isMsalIssuer) {
      const groups = this.getMsalGroups(payload);
      const customGroups = this.getCustomGroups(payload);

      let given_name = payload['given_name'];
      let family_name = payload['family_name'];

      if (!given_name && payload['name']) {
        const nameParts = payload['name'].split(' ');
        given_name = nameParts[0];
        family_name = nameParts.slice(1).join(' ');
      }
      
      const username = payload['preferred_username'] || payload['upn'] || payload['unique_name'];
      const email = payload['preferred_username'] || payload['email'] || payload['upn'];

      userDataStructure = {
        groups: [
          ...groups,
          ...customGroups
        ],
        username: username,
        given_name: given_name,
        family_name: family_name,
        email: email,
      };
    } else {
      jwtLogger.error(`Invalid token issuer: ${payload.iss}`);
      throw new UnauthorizedException();
    }

    return userDataStructure;
  }
}
