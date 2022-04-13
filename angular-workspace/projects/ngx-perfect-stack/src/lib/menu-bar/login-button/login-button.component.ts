import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AuthenticationService} from '../../authentication/authentication.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Observable, of, switchMap, timer} from 'rxjs';
import {Duration, ZonedDateTime} from '@js-joda/core';
import {MessageDialogComponent} from '../../utils/message-dialog/message-dialog.component';

@Component({
  selector: 'lib-login-button',
  templateUrl: './login-button.component.html',
  styleUrls: ['./login-button.component.css']
})
export class LoginButtonComponent implements OnInit {

  loginExpiryTime$: Observable<string>;
  showTimeLeft = false;
  warningModalRef: NgbModalRef;

  constructor(public readonly authenticationService: AuthenticationService,
              private modalService: NgbModal,
              private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loginExpiryTime$ = timer(1000, 1000).pipe(switchMap(value => {

      let displayValue = ''
      if(this.authenticationService.isLoggedIn && this.authenticationService.expiryTime) {
        const durationLeft = Duration.between(ZonedDateTime.now(), this.authenticationService.expiryTime)
        let totalSeconds = durationLeft.seconds();

        if(!this.showTimeLeft && totalSeconds < (3600 - 10)) {
          console.log('Starting warning sequence');
          this.showTimeLeft = true;
          this.warningModalRef = this.modalService.open(MessageDialogComponent);
          this.warningModalRef.componentInstance.title = 'Session Timeout'
          this.warningModalRef.componentInstance.text = 'Your login session is about to expire. Please save any outstanding work and login again.';
          this.changeDetectorRef.detectChanges();
          console.log('Finished warning sequence');
        }

        if(this.authenticationService.isLoggedIn && totalSeconds < (3600 - 30)) {
          this.showTimeLeft = false;
          this.warningModalRef.close();
          this.authenticationService.sessionTimeout();
        }

        const hours = Math.floor(totalSeconds / (60 * 60));
        totalSeconds = totalSeconds - (hours * 60 * 60);
        const mins = Math.floor(totalSeconds / 60);
        totalSeconds = totalSeconds - (mins * 60);
        const seconds = totalSeconds;

        const hoursStr = String(hours).padStart(2, '0');
        const minsStr = String(mins).padStart(2, '0');
        const secondsStr = String(seconds).padStart(2, '0');

        displayValue = `${hoursStr}:${minsStr}:${secondsStr}`;
      }

      return of(displayValue);
    }));
  }

  onLogin() {
    // TODO: this is going to need to change if there is no Person object to start with.
    this.authenticationService.redirectUrl = '/data/Person/search';
    this.authenticationService.login();
  }

  onLogout() {
    this.showTimeLeft = false;
    if(this.warningModalRef) {
      this.warningModalRef.dismiss();
    }
    this.authenticationService.logout();
  }
}
