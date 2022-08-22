import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthenticationService} from '../authentication.service';
import {CognitoUser} from '../user/cognito-user';

@Component({
  selector: 'lib-login-callback',
  templateUrl: './login-callback.component.html',
  styleUrls: ['./login-callback.component.css']
})
export class LoginCallbackComponent implements OnInit {

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    const url = this.router.url;
    if(url) {
      const idToken = this.parseToken('id_token=', '&', url);
      const accessToken = this.parseToken('access_token=', '&', url);
      console.log(`Got idToken = `, idToken);
      console.log(`Got accessToken = `, accessToken);

      if(this.authenticationService.user) {
        if(this.authenticationService.user instanceof CognitoUser) {
          const cognitoUser = this.authenticationService.user;
          cognitoUser.idToken = idToken;
          cognitoUser.accessToken = accessToken;
          cognitoUser.saveTokens();

          // accept the login result (so that user/token is created, but delay the navigation until we notify the server
          this.authenticationService.handleLoginResult(true, true);

          this.authenticationService.sendNotification(idToken, accessToken).subscribe(() => {
            console.log('Authentication notification sent');
            // Now navigate to the first page
            this.authenticationService.navigateToFirstPage();
          });
        }
      }
    }
  }

  parseToken(startMarker: string, endMarker: string, value: string) {
    const startIdx = value.indexOf(startMarker) + startMarker.length;
    const endIdx = value.indexOf(endMarker, startIdx);
    const token = value.substring(startIdx, endIdx);
    return token;
  }

}
