import { Component, OnInit } from '@angular/core';
import {AuthenticationService} from '../authentication.service';
import {Router} from '@angular/router';

@Component({
  selector: 'lib-session-time-out',
  templateUrl: './session-time-out.component.html',
  styleUrls: ['./session-time-out.component.css']
})
export class SessionTimeOutComponent implements OnInit {

  constructor(protected readonly authenticationService: AuthenticationService,
              protected readonly router: Router) { }

  ngOnInit(): void {
  }

  onLogin() {
    this.router.navigate(['/data/Bird/search'])
  }
}
