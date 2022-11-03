import {Injectable} from '@angular/core';
import {NavigationStart, Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: any[] = [];

  constructor(protected readonly router: Router) {
    this.router.events.subscribe((event: any) => {
      if(event instanceof NavigationStart) {
        if(this.toasts.length > 0) {
          console.log('Cleared toast messages because route is changing');
          this.toasts.length = 0;
        }
      }
    });
  }

  showSuccess(message: string) {
    this.show( {
      header: 'Success',
      message: message,
      classname: 'bg-success text-light',
      delay: 5000,
      autohide: true
    });
  }

  showWarning(message: string) {
    this.show( {
      header: 'Warning',
      message: message,
      classname: 'bg-warning',
      delay: 5000,
      autohide: true
    });
  }

  showError(message: string, autohide: boolean) {
    this.show( {
      header: 'Error',
      message: message,
      classname: 'bg-danger text-light',
      delay: 5000,
      autohide: autohide
    });
  }

  show(toastData: any = {}) {
    this.toasts.push(toastData);
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
}
