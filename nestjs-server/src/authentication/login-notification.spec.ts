import { Test } from '@nestjs/testing';
import { CONFIG_MODULE } from '../app.module';
import { AuthenticationModule } from './authentication.module';
import { AuthenticationService } from './authentication.service';

import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { Logger } from '@nestjs/common';
import { LoginNotification } from './login-notification';
import { getKeyIdFromToken } from './jwt.strategy';

describe('LoginNotification', () => {
  const logger = new Logger('LoginNotification');
  let authenticationService: AuthenticationService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CONFIG_MODULE, AuthenticationModule],
      providers: [AuthenticationService],
    }).compile();

    authenticationService = moduleRef.get(AuthenticationService);
  });

  it('should be defined', () => {
    expect(authenticationService).toBeDefined();
  });

  it('should verify a valid token', async () => {
    const testToken =
      'eyJraWQiOiJDSmZyR0QySHpXYWY1bTdxNm5GTjZ4R0wyQk9TY3Y2ZWc2RXd0Uzh4QTBzPSIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoia1p2bjFsX2RMRGZJWktlTEFnWnNhUSIsInN1YiI6IjIwMTk1MjE3LTI2NDMtNDY1YS1iNmQ2LTkxNTYyMzBhODlkNCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGhlYXN0LTIuYW1hem9uYXdzLmNvbVwvYXAtc291dGhlYXN0LTJfQ0lsNVZ2ZldEIiwiY29nbml0bzp1c2VybmFtZSI6InJwZXJmZWN0IiwiZ2l2ZW5fbmFtZSI6IlJpY2hhcmQiLCJhdWQiOiI2MHE0Y25wa3RhcjRyNjltcmliNXJtZnBiMSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNjYwNjk2NjM5LCJleHAiOjE2NjA3MzI2MzksImlhdCI6MTY2MDY5NjY0MCwiZmFtaWx5X25hbWUiOiJQZXJmZWN0IiwiZW1haWwiOiJyaWNoYXJkQHBlcmZlY3QtY29uc3VsdGluZy5jby5ueiJ9.muPcuD0b4xUy1YdxcTdGNPXYRHbBtBqS81swCKN9Y0E7WSLyorDiQJOICJW6NMxT_ynIWfigUeSVOOMcOgr65iZ5-xeqnKwFtYb3c-NQyzHK0Td7rPdWyFwJDRM757sDkcOHTKAa6dGeKVsfrfmuTeV-ntX8MlzxM-bVGziiGp1-dLG_QpWAGgYf_Fq-x1U8Pn4J7i6bS3qap6zKww3s9Fwa0j8Da_LyJvJB4iRzvJ41NFJS4Kv_rMGBn_C0BHYLjRs3ivfqNKNGN0ZDxOikNyeRM9GSA9LamDdm1PD-NMWG0_co5PWkbOK5dAgUqKS2TH9-bm-Zl9jL1jcsZFcJOQ';

    const client = jwksClient({
      jwksUri:
        'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_CIl5VvfWD/.well-known/jwks.json',
    });

    const kid = getKeyIdFromToken(testToken);
    const key = await client.getSigningKey(kid);
    const verifyResult = jwt.verify(testToken, key.getPublicKey());
    console.log(`Verified: ${JSON.stringify(verifyResult)}`);
  });
});
