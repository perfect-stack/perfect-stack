import {Component, Input, OnInit} from '@angular/core';
import {AuthenticationService} from '../authentication/authentication.service';
import {MetaMenuService} from '../meta/menu/meta-menu-service/meta-menu.service';

@Component({
  selector: 'lib-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css']
})
export class MenuBarComponent implements OnInit {

  @Input()
  applicationName = 'App-Name-Here';

  public isMenuCollapsed = true;

  constructor(public readonly authenticationService: AuthenticationService,
              public readonly metaMenuService: MetaMenuService) {}

  ngOnInit(): void {
  }

  onLogin() {
    // TODO: this is going to need to change if there is no Person object to start with.
    this.authenticationService.redirectUrl = '/data/Person/search';
    this.authenticationService.login();
  }

  onLogout() {
    this.authenticationService.logout();
  }
}
