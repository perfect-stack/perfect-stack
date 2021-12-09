import {Component, OnInit} from '@angular/core';
import {AuthenticationService} from './authentication/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(readonly authenticationService: AuthenticationService) {}

  ngOnInit(): void {
  }

  onLogin() {
    this.authenticationService.login();
  }

  onLogout() {
    this.authenticationService.logout();
  }
}
