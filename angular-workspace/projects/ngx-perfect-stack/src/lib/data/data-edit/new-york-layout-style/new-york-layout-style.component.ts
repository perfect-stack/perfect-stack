import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../form-service/form.service';

@Component({
    selector: 'lib-new-york-layout-style',
    templateUrl: './new-york-layout-style.component.html',
    styleUrls: ['./new-york-layout-style.component.css'],
    standalone: false
})
export class NewYorkLayoutStyleComponent implements OnInit {

  @Input()
  ctx: FormContext;

  constructor() { }

  ngOnInit(): void {
  }

}
