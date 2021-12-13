import {Component, OnInit} from '@angular/core';
import {AuthenticationService} from './authentication/authentication.service';
import {MetaService} from './meta/service/meta.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(readonly authenticationService: AuthenticationService, public readonly metaService: MetaService) {}

  ngOnInit(): void {
  }

  onLogin() {
    this.authenticationService.login();
  }

  onLogout() {
    this.authenticationService.logout();
  }
}
