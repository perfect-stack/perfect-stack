import {Component, OnInit} from '@angular/core';
import {AuthenticationService} from './authentication/authentication.service';
import {MetaMenuService} from './meta/menu/meta-menu-service/meta-menu.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public isMenuCollapsed = true;

  constructor(readonly authenticationService: AuthenticationService, public readonly metaMenuService: MetaMenuService) {}

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
