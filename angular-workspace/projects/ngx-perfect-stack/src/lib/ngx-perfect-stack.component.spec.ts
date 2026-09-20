import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { NgxPerfectStackComponent } from "./ngx-perfect-stack.component";
import { STACK_CONFIG, NgxPerfectStackConfig } from "./ngx-perfect-stack-config";
import { AuthenticationService } from "./authentication/authentication.service";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { BehaviorSubject, of } from "rxjs";
import { ToastService } from "./utils/toasts/toast.service";

describe("NgxPerfectStackComponent", () => {
  let component: NgxPerfectStackComponent;
  let fixture: ComponentFixture<NgxPerfectStackComponent>;

  const mockConfig: NgxPerfectStackConfig = {
    apiUrl: "http://localhost:3080",
    authenticationProvider: "None",
  } as any;

  const mockAuthService = {
    user$: new BehaviorSubject(null),
    notifyUser$: new BehaviorSubject(null),
    isLoggedIn: false,
  };

  const mockToastService = {
    show: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgxPerfectStackComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      providers: [
        { provide: STACK_CONFIG, useValue: mockConfig },
        { provide: AuthenticationService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxPerfectStackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
