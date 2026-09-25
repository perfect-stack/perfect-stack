import { TestBed } from "@angular/core/testing";
import { AuthorizationService } from "./authorization.service";
import { AuthenticationService } from "./authentication.service";
import { MetaRoleService } from "../meta/role/meta-role-service/meta-role.service";
import { STACK_CONFIG, NgxPerfectStackConfig } from "../ngx-perfect-stack-config";
import { MetaRole } from "../domain/meta.role";
import { BehaviorSubject } from "rxjs";
import { User } from "./user/user";

describe("AuthorizationService", () => {
  let service: AuthorizationService;
  let mockAuthService: any;
  let mockMetaRoleService: any;
  let userSubject: BehaviorSubject<User | null>;

  const testRoles: MetaRole[] = [
    {
      name: "Viewer",
      group: "user",
      inherits: "",
      description: "Viewer role",
      permissions: [
        { action: "Read", subject: "Any" },
        { action: "Edit", subject: "Authentication" },
        { action: "Menu", subject: "Station" },
        { action: "Menu", subject: "MonitoringStation" },
      ],
    } as any,
    {
      name: "Editor",
      group: "user",
      inherits: "Viewer",
      description: "Editor role",
      permissions: [
        { action: "Edit", subject: "Event" },
        { action: "Edit", subject: "MonitoringStation" },
      ],
    } as any,
    {
      name: "Administrator",
      group: "admin",
      inherits: "Editor",
      description: "Admin role",
      permissions: [
        { action: "Edit", subject: "Species" },
        { action: "Menu", subject: "Admin" },
      ],
    } as any,
  ];

  const stackConfig: NgxPerfectStackConfig = {
    apiUrl: "http://localhost:3080",
    authenticationProvider: "MSAL",
    metaRoleList: testRoles,
  } as any;

  beforeEach(() => {
    userSubject = new BehaviorSubject<User | null>(null);
    mockAuthService = {
      user$: userSubject,
    };
    mockMetaRoleService = {};

    TestBed.configureTestingModule({
      providers: [
        AuthorizationService,
        { provide: AuthenticationService, useValue: mockAuthService },
        { provide: MetaRoleService, useValue: mockMetaRoleService },
        { provide: STACK_CONFIG, useValue: stackConfig },
      ],
    });

    service = TestBed.inject(AuthorizationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should load permissions with inheritance correctly", () => {
    const permMap = service.loadPermissionsFromMetaRoleList(testRoles);
    expect(permMap.has("admin")).toBeTrue();
    const adminPerms = permMap.get("admin") || [];
    // Admin inherits Editor which inherits Viewer (Read.Any, Menu.Station, Menu.MonitoringStation, Edit.MonitoringStation, Edit.Species)
    expect(adminPerms).toContain("Read.Any");
    expect(adminPerms).toContain("Edit.MonitoringStation");
    expect(adminPerms).toContain("Edit.Species");
    expect(adminPerms).toContain("Menu.MonitoringStation");
    expect(adminPerms).toContain("Menu.Admin");
  });

  it("should permit action when user has Read.Any permission for a specific subject", () => {
    const mockUser: User = {
      getGroups: () => ["admin"],
    } as any;
    userSubject.next(mockUser);

    // MonitoringStation search requires Read.MonitoringStation
    const canReadStation = service.checkPermission("Read", "MonitoringStation");
    expect(canReadStation).toBeTrue();
  });

  it("should permit menu access for inherited Menu permissions", () => {
    const mockUser: User = {
      getGroups: () => ["admin"],
    } as any;
    userSubject.next(mockUser);

    const canMenuStation = service.checkPermission("Menu", "MonitoringStation");
    expect(canMenuStation).toBeTrue();

    const canMenuAdmin = service.checkPermission("Menu", "Admin");
    expect(canMenuAdmin).toBeTrue();
  });

  it("should deny permission when user does not have required action", () => {
    const mockUser: User = {
      getGroups: () => ["user"], // viewer/editor
    } as any;
    userSubject.next(mockUser);

    // User does not have Delete.Species
    const canDeleteSpecies = service.checkPermission("Delete", "Species");
    expect(canDeleteSpecies).toBeFalse();
  });

  it("should handle case-insensitive matches", () => {
    const mockUser: User = {
      getGroups: () => ["admin"],
    } as any;
    userSubject.next(mockUser);

    expect(service.checkPermission("read", "monitoringstation")).toBeTrue();
    expect(service.checkPermission("EDIT", "SPECIES")).toBeTrue();
  });
});
