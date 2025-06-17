import {Component, OnInit} from '@angular/core';
import {ToastService} from './toast.service';
import {NgbToast} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-toasts',
    templateUrl: './toasts.component.html',
    styleUrls: ['./toasts.component.css'],
    standalone: false
})
export class ToastsComponent implements OnInit {

  constructor(public readonly toastService: ToastService) { }

  ngOnInit(): void {
  }

  onClose(toastComponent: NgbToast) {
    toastComponent.hide();
  }
}
