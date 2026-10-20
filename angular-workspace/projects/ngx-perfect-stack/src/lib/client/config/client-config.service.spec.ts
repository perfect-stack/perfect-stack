import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ClientConfigService } from './client-config.service';
import {
  NgxPerfectStackConfig,
  STACK_CONFIG,
} from '../../ngx-perfect-stack-config';

describe('ClientConfigService', () => {
  let service: ClientConfigService;
  let httpMock: HttpTestingController;

  const mockStackConfig: Partial<NgxPerfectStackConfig> = {
    apiUrl: 'http://localhost:3080',
    environment: 'dev',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ClientConfigService,
        { provide: STACK_CONFIG, useValue: mockStackConfig },
      ],
    });

    service = TestBed.inject(ClientConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should cache getConfig response and not make multiple http requests', (done) => {
    service.getConfig().subscribe((cfg) => {
      expect(cfg.META_EDIT_ENABLED).toBe('Entity,Menu');
    });

    service.getConfig().subscribe((cfg) => {
      expect(cfg.META_EDIT_ENABLED).toBe('Entity,Menu');
      done();
    });

    const req = httpMock.expectOne('http://localhost:3080/client/config');
    expect(req.request.method).toBe('GET');
    req.flush({ META_EDIT_ENABLED: 'Entity,Menu' });
  });

  it('should return true if control value is present in META_EDIT_ENABLED', (done) => {
    service.isMetaEditEnabled('Entity').subscribe((enabled) => {
      expect(enabled).toBe(true);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3080/client/config');
    req.flush({ META_EDIT_ENABLED: 'Entity, Menu, Page' });
  });

  it('should return false if control value is not present in META_EDIT_ENABLED', (done) => {
    service.isMetaEditEnabled('Role').subscribe((enabled) => {
      expect(enabled).toBe(false);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3080/client/config');
    req.flush({ META_EDIT_ENABLED: 'Entity, Menu, Page' });
  });

  it('should return false if META_EDIT_ENABLED is empty string', (done) => {
    service.isMetaEditEnabled('Entity').subscribe((enabled) => {
      expect(enabled).toBe(false);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3080/client/config');
    req.flush({ META_EDIT_ENABLED: '' });
  });

  it('should enforce case sensitive matching', (done) => {
    service.isMetaEditEnabled('entity').subscribe((enabled) => {
      expect(enabled).toBe(false);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3080/client/config');
    req.flush({ META_EDIT_ENABLED: 'Entity, Menu' });
  });

  it('should return environment from server ENV_NAME', (done) => {
    service.getEnvironment().subscribe((env) => {
      expect(env).toBe('test');
      done();
    });

    const req = httpMock.expectOne('http://localhost:3080/client/config');
    req.flush({ ENV_NAME: 'TEST' });
  });

  it('should fall back to stackConfig.environment if ENV_NAME is missing', (done) => {
    service.getEnvironment().subscribe((env) => {
      expect(env).toBe('dev');
      done();
    });

    const req = httpMock.expectOne('http://localhost:3080/client/config');
    req.flush({});
  });
});
