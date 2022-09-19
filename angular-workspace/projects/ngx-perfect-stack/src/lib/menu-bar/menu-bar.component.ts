import {Component, Input, OnInit} from '@angular/core';
import {AuthenticationService} from '../authentication/authentication.service';
import {MetaMenuService} from '../meta/menu/meta-menu-service/meta-menu.service';
import {AuthorizationService} from '../authentication/authorization.service';
import {ActionType} from '../domain/meta.role';

@Component({
  selector: 'lib-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css']
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

  constructor(public readonly authenticationService: AuthenticationService,
              public readonly authorizationService: AuthorizationService,
              public readonly metaMenuService: MetaMenuService) {
  }

  ngOnInit(): void {
    this.authorizationService.permissionMap$.subscribe((permissionMap) => {
      // The first value through this handler will be null, but that's ok. It just takes a little while for the
      // AuthorizationServer to load the permissions.
      console.log('MenuBarComponent Permissions: ', permissionMap)
      this.updateMenuEnabled();
    });
  }

  updateMenuEnabled() {
    const nextMenuEnabled: any = {};
    for(const nextMenu of this.metaMenuService.menu.menuList) {
      nextMenuEnabled[nextMenu.label] = this.authorizationService.checkPermission(ActionType.Menu, nextMenu.label);
    }
    this.menuEnabled = nextMenuEnabled;
  }
}
