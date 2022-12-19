import {Component, Input, OnInit} from '@angular/core';
import {AuthenticationService} from './authentication/authentication.service';
import {AuthenticationClientService} from './authentication/authentication-client.service';

@Component({
  selector: 'lib-ngx-perfect-stack',
  template: `<lib-menu-bar [applicationTitle]="applicationTitle"
                           [applicationTitleFont]="applicationTitleFont"
                           [applicationLogo]="applicationLogo"
                           [applicationLogoWidth]="applicationLogoWidth"
                           [menuBarDividerColor]="menuBarDividerColor"
                           [menuBarBackgroundColor]="menuBarBackgroundColor"></lib-menu-bar>`,
  styles: [
  ]
})
export class NgxPerfectStackComponent implements OnInit {

  @Input()
  applicationTitle: string;

  @Input()
  applicationTitleFont: string;

  @Input()
  applicationLogo: string;

  @Input()
  applicationLogoWidth: string;

  @Input()
  menuBarDividerColor: string;

  @Input()
  menuBarBackgroundColor: string;

  constructor(protected readonly authenticationService: AuthenticationService,
              protected readonly authenticationClientService: AuthenticationClientService) { }

  ngOnInit(): void {
    this.authenticationService.notifyUser$.subscribe((user) => {
      if(user) {
        console.log('XXX got new user event with user XXX');
        const bearerToken = user.getBearerToken();
        if(bearerToken) {
          this.authenticationClientService.sendNotification(bearerToken).subscribe(() => {
            console.log('login notification sent');
          });
        }
      }
      else {
        console.log('XXX got new user event user is falsey XXX');
      }
    });
  }
}
