import {Injectable, TemplateRef} from '@angular/core';
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
    this.show( message, {
      header: 'Success',
      classname: 'bg-success text-light',
      delay: 5000,
      autohide: true
    });
  }

  showWarning(message: string) {
    this.show( message, {
      header: 'Warning',
      classname: 'bg-warning',
      delay: 5000,
      autohide: true
    });
  }

  showError(message: string, autohide: boolean) {
    this.show( message, {
      header: 'Error',
      classname: 'bg-danger text-light',
      delay: 5000,
      autohide: autohide
    });
  }

  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.toasts.push({ textOrTpl, ...options });
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
}
