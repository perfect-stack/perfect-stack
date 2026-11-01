import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfig: Record<string, string> = {
    COGNITO_AUTHENTICATION_ISSUER: 'https://cognito-idp.ap-southeast-2.amazonaws.com/test-pool',
    COGNITO_AUTHENTICATION_PUBLIC_KEY_URL: 'https://cognito-idp.ap-southeast-2.amazonaws.com/test-pool/.well-known/jwks.json',
    MSAL_AUTHENTICATION_ISSUER: 'https://login.microsoftonline.com/test-tenant/v2.0',
    MSAL_AUTHENTICATION_PUBLIC_KEY_URL: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate - MS Entra Workforce token', () => {
    it('should validate a standard MS Entra workforce token', async () => {
      const payload: any = {
        iss: 'https://login.microsoftonline.com/test-tenant/v2.0',
        sub: 'user-123',
        name: 'Jane Doe',
        preferred_username: 'jane.doe@doc.govt.nz',
        roles: ['carmon-admin', 'carmon-user'],
      };

      const result = await strategy.validate(payload);
      expect(result).toBeDefined();
      expect(result.username).toBe('jane.doe@doc.govt.nz');
      expect(result.email).toBe('jane.doe@doc.govt.nz');
      expect(result.given_name).toBe('Jane');
      expect(result.family_name).toBe('Doe');
      expect(result.groups).toContain('carmon-admin');
      expect(result.groups).toContain('carmon-user');
    });
  });

  describe('validate - Azure External ID (CIAM) token', () => {
    it('should validate an External ID token with .ciamlogin.com issuer and email fallback', async () => {
      const payload: any = {
        iss: 'https://carmonexternal.ciamlogin.com/ext-tenant/v2.0',
        sub: 'ext-user-456',
        given_name: 'John',
        family_name: 'Contractor',
        email: 'john.contractor@gmail.com',
        roles: ['carmon-viewer'],
      };

      const result = await strategy.validate(payload);
      expect(result).toBeDefined();
      expect(result.username).toBe('john.contractor@gmail.com');
      expect(result.email).toBe('john.contractor@gmail.com');
      expect(result.given_name).toBe('John');
      expect(result.family_name).toBe('Contractor');
      expect(result.groups).toContain('carmon-viewer');
    });

    it('should support extension_Role claim if emitted by External ID user flow', async () => {
      const payload: any = {
        iss: 'https://carmonexternal.ciamlogin.com/ext-tenant/v2.0',
        sub: 'ext-user-789',
        name: 'Bob Smith',
        emails: ['bob.smith@partner.org'],
        extension_Role: 'carmon-external-user',
      };

      const result = await strategy.validate(payload);
      expect(result).toBeDefined();
      expect(result.username).toBe('bob.smith@partner.org');
      expect(result.email).toBe('bob.smith@partner.org');
      expect(result.given_name).toBe('Bob');
      expect(result.family_name).toBe('Smith');
      expect(result.groups).toContain('carmon-external-user');
    });
  });

  describe('validate - Unknown issuer', () => {
    it('should throw UnauthorizedException for untrusted issuer', async () => {
      const payload: any = {
        iss: 'https://evil-attacker.com/v2.0',
        sub: 'attacker',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
