import {Component, Inject, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticationService} from '../authentication/authentication.service';
import {MetaMenuService} from '../meta/menu/meta-menu-service/meta-menu.service';
import {AuthorizationService} from '../authentication/authorization.service';
import {ActionType} from '../domain/meta.role';
import {MenuItem, OpenIn} from '../domain/meta.menu';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';

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

  constructor(@Inject(STACK_CONFIG)
              public readonly stackConfig: NgxPerfectStackConfig,
              public readonly authenticationService: AuthenticationService,
              public readonly authorizationService: AuthorizationService,
              public readonly metaMenuService: MetaMenuService,
              public readonly router: Router) {
  }

  ngOnInit(): void {
    this.authenticationService.user$.subscribe((user) => {
      // The first value through this handler can be null if it needs to be but that's ok.
      console.log('MenuBarComponent User updated: ', user);
      this.updateMenuEnabled();
    });
  }

  updateMenuEnabled() {
    // sweep through the menus and check permissions for each. store this in a variable and only update it when the
    // user changes
    const nextMenuEnabled: any = {};
    if (this.metaMenuService.menu && this.metaMenuService.menu.menuList) {
      for(const nextMenu of this.metaMenuService.menu.menuList) {
        nextMenuEnabled[nextMenu.label] = this.authorizationService.checkPermission(ActionType.Menu, nextMenu.label);

        if(nextMenu.items && nextMenu.items.length > 0) {

          for(const nextMenuItem of nextMenu.items) {
            if(nextMenuItem.roles && nextMenuItem.roles.length > 0) {
              let inRole = false;
              for (const nextRole of nextMenuItem.roles) {
                inRole = this.authorizationService.userInRole(nextRole);
                if (inRole) {
                  break;
                }
              }

              if(inRole) {
                this.menuOptionEnabled[nextMenuItem.label] = inRole;
                break;
              }
            }
          }
        }
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
