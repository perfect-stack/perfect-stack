import { MenuBarComponent } from './menu-bar.component';
import { MenuItem, Menu } from '../domain/meta.menu';
import { of } from 'rxjs';

describe('MenuBarComponent', () => {
  let component: MenuBarComponent;
  let mockStackConfig: any;
  let mockAuthService: any;
  let mockAuthorizationService: any;
  let mockMetaMenuService: any;
  let mockClientConfigService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockStackConfig = {
      apiUrl: 'http://localhost:3080',
      environment: 'dev',
      showMenuLoginBtn: false,
    };

    mockAuthService = {
      user$: of(null),
      isLoggedIn: true,
    };

    mockAuthorizationService = {
      checkPermission: jasmine.createSpy('checkPermission').and.returnValue(true),
      userInRole: jasmine.createSpy('userInRole').and.returnValue(true),
    };

    mockMetaMenuService = {
      menu: { menuList: [] },
    };

    mockClientConfigService = {
      getEnvironment: jasmine.createSpy('getEnvironment').and.returnValue(of('dev')),
    };

    mockRouter = {
      navigateByUrl: jasmine.createSpy('navigateByUrl'),
    };

    component = new MenuBarComponent(
      mockStackConfig,
      mockAuthService,
      mockAuthorizationService,
      mockMetaMenuService,
      mockClientConfigService,
      mockRouter
    );
  });

  describe('isMenuItemVisible', () => {
    it('should return true if no environments are specified (regardless of roles)', () => {
      const item: MenuItem = {
        label: 'Capture Event',
        route: '/data/CaptureEvent/search',
        editable: true,
        roles: ['Administrator'],
        environments: [],
      };
      expect(component.isMenuItemVisible(item)).toBe(true);
    });

    it('should return true if item environment matches currentEnvironment', () => {
      component.currentEnvironment = 'dev';
      const item: MenuItem = {
        label: 'Dev Only Item',
        route: '/data/Dev/search',
        editable: true,
        roles: [],
        environments: ['dev', 'test'],
      };
      expect(component.isMenuItemVisible(item)).toBe(true);
    });

    it('should return false if item environment does not match currentEnvironment', () => {
      component.currentEnvironment = 'prod';
      const item: MenuItem = {
        label: 'Dev Only Item',
        route: '/data/Dev/search',
        editable: true,
        roles: [],
        environments: ['dev', 'test'],
      };
      expect(component.isMenuItemVisible(item)).toBe(false);
    });

    it('should perform case-insensitive environment matching', () => {
      component.currentEnvironment = 'PROD';
      const item: MenuItem = {
        label: 'Prod Item',
        route: '/data/Prod/search',
        editable: true,
        roles: [],
        environments: ['prod'],
      };
      expect(component.isMenuItemVisible(item)).toBe(true);
    });
  });

  describe('getVisibleMenuItems & updateMenuEnabled', () => {
    it('should filter items by environment', () => {
      component.currentEnvironment = 'prod';
      const menu: Menu = {
        label: 'Observe',
        items: [
          {
            label: 'Capture Event',
            route: '/data/CaptureEvent/search',
            editable: true,
            roles: ['Administrator'],
            environments: [],
          },
          {
            label: 'Experimental Feature',
            route: '/data/Exp/search',
            editable: true,
            roles: [],
            environments: ['dev'],
          },
        ],
      };

      const visible = component.getVisibleMenuItems(menu);
      expect(visible.length).toBe(1);
      expect(visible[0].label).toBe('Capture Event');
    });

    it('should disable top-level menu if all items are hidden by environment', () => {
      component.currentEnvironment = 'prod';
      const menu: Menu = {
        label: 'Dev Tools',
        items: [
          {
            label: 'Mock Reset',
            route: '/reset',
            editable: true,
            roles: [],
            environments: ['dev'],
          },
        ],
      };
      mockMetaMenuService.menu.menuList = [menu];

      component.updateMenuEnabled();
      expect(component.menuEnabled['Dev Tools']).toBe(false);
    });

    it('should enable top-level menu if at least one item is visible', () => {
      component.currentEnvironment = 'dev';
      const menu: Menu = {
        label: 'Dev Tools',
        items: [
          {
            label: 'Mock Reset',
            route: '/reset',
            editable: true,
            roles: [],
            environments: ['dev'],
          },
        ],
      };
      mockMetaMenuService.menu.menuList = [menu];

      component.updateMenuEnabled();
      expect(component.menuEnabled['Dev Tools']).toBe(true);
    });
  });
});
