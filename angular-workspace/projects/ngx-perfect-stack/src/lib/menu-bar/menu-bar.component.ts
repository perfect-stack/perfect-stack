import {Component, Inject, Input, OnInit} from '@angular/core';
import {AuthenticationService} from '../authentication/authentication.service';
import {MetaMenuService} from '../meta/menu/meta-menu-service/meta-menu.service';
import {AuthorizationService} from '../authentication/authorization.service';
import {ActionType} from '../domain/meta.role';
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

  constructor(@Inject(STACK_CONFIG)
              public readonly stackConfig: NgxPerfectStackConfig,
              public readonly authenticationService: AuthenticationService,
              public readonly authorizationService: AuthorizationService,
              public readonly metaMenuService: MetaMenuService) {
  }

  ngOnInit(): void {
    this.authenticationService.user$.subscribe((user) => {
      // The first value through this handler can be null if it needs to be but that's ok.
      console.log('MenuBarComponent User updated: ', user)
      this.updateMenuEnabled();
    });
  }

  updateMenuEnabled() {
    // sweep through the menus and check permissions for each. store this in a variable and only update it when the
    // user changes
    const nextMenuEnabled: any = {};
    for(const nextMenu of this.metaMenuService.menu.menuList) {
      nextMenuEnabled[nextMenu.label] = this.authorizationService.checkPermission(ActionType.Menu, nextMenu.label);
    }
    this.menuEnabled = nextMenuEnabled;
  }

  showDefaultLoginButton() {
    return this.authenticationService.isLoggedIn || this.stackConfig.showMenuLoginBtn;
  }
}
