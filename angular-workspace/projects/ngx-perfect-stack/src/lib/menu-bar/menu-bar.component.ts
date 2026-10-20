import {Component, Inject, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticationService} from '../authentication/authentication.service';
import {MetaMenuService} from '../meta/menu/meta-menu-service/meta-menu.service';
import {AuthorizationService} from '../authentication/authorization.service';
import {ActionType} from '../domain/meta.role';
import {Menu, MenuItem, OpenIn} from '../domain/meta.menu';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import {ClientConfigService} from '../client/config/client-config.service';

@Component({
    selector: 'lib-menu-bar',
    templateUrl: './menu-bar.component.html',
    styleUrls: ['./menu-bar.component.css'],
    standalone: false
})
export class MenuBarComponent implements OnInit {

  @Input()
  applicationTitle = 'Title';

  @Input()
  applicationTitleFont = 'Serif';

  @Input()
  applicationLogo: string;

  @Input()
  applicationLogoWidth: string;

  @Input()
  menuBarDividerColor: string;

  @Input()
  menuBarBackgroundColor: string;

  menuEnabled: any = {};
  menuOptionEnabled: any = {};
  currentEnvironment = (this.stackConfig.environment || 'dev').toLowerCase();

  constructor(@Inject(STACK_CONFIG)
              public readonly stackConfig: NgxPerfectStackConfig,
              public readonly authenticationService: AuthenticationService,
              public readonly authorizationService: AuthorizationService,
              public readonly metaMenuService: MetaMenuService,
              public readonly clientConfigService: ClientConfigService,
              public readonly router: Router) {
  }

  ngOnInit(): void {
    this.authenticationService.user$.subscribe((user) => {
      // The first value through this handler can be null if it needs to be but that's ok.
      console.log('MenuBarComponent User updated: ', user);
      this.updateMenuEnabled();
    });

    this.clientConfigService.getEnvironment().subscribe((env) => {
      if (env) {
        this.currentEnvironment = env;
        this.updateMenuEnabled();
      }
    });
  }

  isMenuItemVisible(menuItem: MenuItem): boolean {
    if (!menuItem) {
      return false;
    }

    // Environment feature flag filter:
    // If no environments specified -> visible in all environments
    // If environments specified -> visible only in matching environment
    if (menuItem.environments && menuItem.environments.length > 0) {
      const activeEnv = (this.currentEnvironment || '').trim().toLowerCase();
      const match = menuItem.environments.some((env) => (env || '').trim().toLowerCase() === activeEnv);
      if (!match) {
        return false;
      }
    }

    return true;
  }

  getVisibleMenuItems(menu: Menu): MenuItem[] {
    if (!menu || !menu.items) {
      return [];
    }
    return menu.items.filter((item) => this.isMenuItemVisible(item));
  }

  updateMenuEnabled() {
    // sweep through the menus and check permissions for each. store this in a variable and only update it when the
    // user changes or environment changes
    const nextMenuEnabled: any = {};
    if (this.metaMenuService.menu && this.metaMenuService.menu.menuList) {
      for(const nextMenu of this.metaMenuService.menu.menuList) {
        const hasMenuPermission = this.authorizationService.checkPermission(ActionType.Menu, nextMenu.label);
        const visibleItems = this.getVisibleMenuItems(nextMenu);
        nextMenuEnabled[nextMenu.label] = hasMenuPermission && visibleItems.length > 0;
      }
    }

    this.menuEnabled = nextMenuEnabled;
  }

  showDefaultLoginButton() {
    return this.authenticationService.isLoggedIn || this.stackConfig.showMenuLoginBtn;
  }

  onMenuItemClick(menuItem: MenuItem, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    const openIn = menuItem.openIn || OpenIn.Current;
    const route = menuItem.route;

    switch (openIn) {
      case OpenIn.NewTab:
        window.open(route, '_blank');
        break;
      case OpenIn.NewWindow:
        window.open(route, '_blank', 'location=yes,height=700,width=1000,scrollbars=yes,status=yes');
        break;
      case OpenIn.Current:
      default:
        if (this.isExternalOrServerRoute(route)) {
          window.location.href = route;
        } else {
          this.router.navigateByUrl(route);
        }
        break;
    }
  }

  isInternalRoute(menuItem: MenuItem): boolean {
    const openIn = menuItem.openIn || OpenIn.Current;
    return openIn === OpenIn.Current && !this.isExternalOrServerRoute(menuItem.route);
  }

  isExternalOrServerRoute(route: string): boolean {
    return !route || route === '/api' || route.startsWith('/api/') || route.startsWith('http://') || route.startsWith('https://');
  }
}
