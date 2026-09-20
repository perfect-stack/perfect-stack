import {Injectable, signal} from '@angular/core';
import {NavigationStart, Router} from '@angular/router';

export interface ToastData {
  header: string;
  message: string;
  classname: string;
  delay?: number;
  autohide?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastData[]>([]);

  constructor(protected readonly router: Router) {
    this.router.events.subscribe((event: any) => {
      if(event instanceof NavigationStart) {
        if(this.toasts().length > 0) {
          console.log('[ToastService] Cleared toast messages because route is changing to', event.url);
          this.toasts.set([]);
        }
      }
    });
  }

  showSuccess(message: string) {
    this.show({
      header: 'Success',
      message: message,
      classname: 'bg-success text-light',
      delay: 5000,
      autohide: true
    });
  }

  showWarning(message: string) {
    this.show({
      header: 'Warning',
      message: message,
      classname: 'bg-warning',
      delay: 5000,
      autohide: true
    });
  }

  showError(message: string, autohide: boolean) {
    this.show({
      header: 'Error',
      message: message,
      classname: 'bg-danger text-light',
      delay: 5000,
      autohide: autohide
    });
  }

  show(toastData: any = {}) {
    this.toasts.update(toasts => [...toasts, toastData]);
  }

  remove(toast: any) {
    this.toasts.update(toasts => toasts.filter(t => t !== toast));
  }
}
