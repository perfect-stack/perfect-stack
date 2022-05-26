import { Component, OnInit } from '@angular/core';
import {AuthenticationService} from '../authentication.service';

@Component({
  selector: 'lib-session-time-out',
  templateUrl: './session-time-out.component.html',
  styleUrls: ['./session-time-out.component.css']
})
export class SessionTimeOutComponent implements OnInit {

  constructor(protected readonly authenticationService: AuthenticationService) { }

  ngOnInit(): void {
  }
}
