import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AuthenticationService} from '../../authentication/authentication.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Observable, of, switchMap, timer} from 'rxjs';
import {Duration, ZonedDateTime} from '@js-joda/core';
import {MessageDialogComponent} from '../../utils/message-dialog/message-dialog.component';
import {MetaMenuService} from '../../meta/menu/meta-menu-service/meta-menu.service';

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
              protected readonly metaMenuService: MetaMenuService,
              private modalService: NgbModal,
              private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loginExpiryTime$ = timer(1000, 1000).pipe(switchMap(() => {

      let displayValue = ''
      if(this.authenticationService.isLoggedIn && this.authenticationService.expiryTime) {
        const durationLeft = Duration.between(ZonedDateTime.now(), this.authenticationService.expiryTime)
        let totalSeconds = durationLeft.seconds();

        let remainingSeconds = totalSeconds;
        const hours = Math.floor(remainingSeconds / (60 * 60));
        remainingSeconds = remainingSeconds - (hours * 60 * 60);
        const mins = Math.floor(remainingSeconds / 60);
        remainingSeconds = remainingSeconds - (mins * 60);
        const seconds = remainingSeconds;

        const hoursStr = String(hours).padStart(2, '0');
        const minsStr = String(mins).padStart(2, '0');
        const secondsStr = String(seconds).padStart(2, '0');

        displayValue = `${hoursStr}:${minsStr}:${secondsStr}`;

        if(!this.showTimeLeft && totalSeconds < ((3600 * 10) - 10)) {
//        if(!this.showTimeLeft && totalSeconds < (5 * 60)) {
          console.log(`Starting warning sequence. totalSeconds left = ${totalSeconds}`);
          this.showTimeLeft = true;
          this.warningModalRef = this.modalService.open(MessageDialogComponent);
          this.warningModalRef.componentInstance.title = 'Session Timeout Warning'
          this.warningModalRef.componentInstance.text = `Your login session is about to expire in ${displayValue} (hh:mm:ss) minutes. After closing this message please save any outstanding work and login again from the menu bar button above.`;
          this.changeDetectorRef.detectChanges();
          console.log('Finished warning sequence');
        }

        if(this.authenticationService.isLoggedIn && totalSeconds < ((3600 * 10) - 60)) {
//        if(this.authenticationService.isLoggedIn && totalSeconds < 30) {
          this.showTimeLeft = false;
          this.warningModalRef.close();
          this.authenticationService.sessionTimeout();
        }

      }

      return of(displayValue);
    }));
  }

  onLogin() {
    const menuItem = this.metaMenuService.getFirstLoginMenuItem();
    if(menuItem) {
      console.log(`LoginButton setting up first login menu item`);
      this.authenticationService.redirectUrl = menuItem.route;
    }
    else {
      console.log(`LoginButton unable to determine first login page`);
    }
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
