import { Component, OnInit } from '@angular/core';
import {FormContext, FormService} from '../data-edit/form-service/form.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'lib-controller',
  templateUrl: './controller.component.html',
  styleUrls: ['./controller.component.css']
})
export class ControllerComponent implements OnInit {

  ctx$: Observable<FormContext>;

  constructor(protected formService: FormService) { }

  ngOnInit(): void {
    this.ctx$ = this.formService.loadFormContext('Project', 'view', '24ff597d-728e-4208-8c67-b8f2724d6fcd');
  }

}
