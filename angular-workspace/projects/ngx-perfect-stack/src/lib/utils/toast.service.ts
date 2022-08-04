import {Injectable, TemplateRef} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: any[] = [];

  showSuccess(message: string) {
    this.show( message, { classname: 'bg-success text-light', delay: 5000 });
  }

  showWarning(message: string) {
    this.show( message, { classname: 'bg-warning', delay: 5000 });
  }

  showError(message: string) {
    this.show( message, { classname: 'bg-danger text-light', delay: 5000 });
  }

  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.toasts.push({ textOrTpl, ...options });
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
}
