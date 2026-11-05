import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { MetaRoleService } from '../meta/meta-role/meta-role.service';
import { MetaRole } from '../domain/meta.role';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  const testRoles: MetaRole[] = [
    {
      name: 'Viewer',
      group: 'user',
      inherits: '',
      description: 'Viewer role',
      permissions: [
        { action: 'Read', subject: 'Any' },
        { action: 'Edit', subject: 'Authentication' },
        { action: 'Menu', subject: 'Station' },
      ],
    } as any,
    {
      name: 'Editor',
      group: 'user',
      inherits: 'Viewer',
      description: 'Editor role',
      permissions: [
        { action: 'Edit', subject: 'Event' },
        { action: 'Any', subject: 'Observation' },
      ],
    } as any,
    {
      name: 'Administrator',
      group: 'admin',
      inherits: 'Editor',
      description: 'Admin role',
      permissions: [
        { action: 'Edit', subject: 'Species' },
        { action: 'Edit', subject: 'Meta' },
        { action: 'Menu', subject: 'Admin' },
        { action: 'Delete', subject: 'Any' },
      ],
    } as any,
  ];

  beforeEach(async () => {
    const mockMetaRoleService = {
      findAll: jest.fn().mockResolvedValue(testRoles),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: MetaRoleService, useValue: mockMetaRoleService },
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should permit action when user has Read.Any permission for a business entity', async () => {
    const permissionMap = await service.loadPermissions();
    const canReadEvent = service.checkPermissionWithMap(
      ['user'],
      permissionMap,
      'Read',
      'CaptureEvent',
    );
    expect(canReadEvent).toBe(true);
  });

  it('should protect Special Subjects from Read.Any wildcards', async () => {
    const permissionMap = await service.loadPermissions();
    // Viewer has Read.Any, but Meta and Batch are special subjects
    const canReadMeta = service.checkPermissionWithMap(
      ['user'],
      permissionMap,
      'Read',
      'Meta',
    );
    expect(canReadMeta).toBe(false);

    const canReadBatch = service.checkPermissionWithMap(
      ['user'],
      permissionMap,
      'Read',
      'Batch',
    );
    expect(canReadBatch).toBe(false);
  });

  it('should allow explicit grants on Special Subjects', async () => {
    const permissionMap = await service.loadPermissions();
    // Admin has explicit Edit.Meta
    const canEditMeta = service.checkPermissionWithMap(
      ['admin'],
      permissionMap,
      'Edit',
      'Meta',
    );
    expect(canEditMeta).toBe(true);
  });

  it('should expand Action: Any to all CRUD data operations', async () => {
    const permissionMap = await service.loadPermissions();
    // Editor has Any.Observation
    expect(
      service.checkPermissionWithMap(
        ['user'],
        permissionMap,
        'Read',
        'Observation',
      ),
    ).toBe(true);
    expect(
      service.checkPermissionWithMap(
        ['user'],
        permissionMap,
        'Edit',
        'Observation',
      ),
    ).toBe(true);
    expect(
      service.checkPermissionWithMap(
        ['user'],
        permissionMap,
        'Delete',
        'Observation',
      ),
    ).toBe(true);
    expect(
      service.checkPermissionWithMap(
        ['user'],
        permissionMap,
        'Archive',
        'Observation',
      ),
    ).toBe(true);
  });

  it('should safeguard Menu actions from Action: Any wildcards', async () => {
    const permissionMap = await service.loadPermissions();
    // Editor has Any.Observation, which must NOT grant Menu.Observation
    expect(
      service.checkPermissionWithMap(
        ['user'],
        permissionMap,
        'Menu',
        'Observation',
      ),
    ).toBe(false);
  });

  it('should allow Delete.Any for domain entities including Person', async () => {
    const permissionMap = await service.loadPermissions();
    // Admin has Delete.Any
    expect(
      service.checkPermissionWithMap(['admin'], permissionMap, 'Delete', 'Person'),
    ).toBe(true);
    expect(
      service.checkPermissionWithMap(
        ['admin'],
        permissionMap,
        'Delete',
        'CaptureEvent',
      ),
    ).toBe(true);
  });

  it('should perform case-insensitive matches', async () => {
    const permissionMap = await service.loadPermissions();
    expect(
      service.checkPermissionWithMap(['admin'], permissionMap, 'edit', 'species'),
    ).toBe(true);
    expect(
      service.checkPermissionWithMap(['admin'], permissionMap, 'EDIT', 'SPECIES'),
    ).toBe(true);
  });
});
