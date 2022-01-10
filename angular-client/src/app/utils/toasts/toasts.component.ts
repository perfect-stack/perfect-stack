import {Component, OnInit, TemplateRef} from '@angular/core';
import {ToastService} from '../toast.service';

@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.component.html',
  styleUrls: ['./toasts.component.css']
})
export class ToastsComponent implements OnInit {

  constructor(public readonly toastService: ToastService) { }

  ngOnInit(): void {
  }

  isTemplate(toast: any) {
    return toast.textOrTpl instanceof TemplateRef;
  }
}
