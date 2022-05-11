import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../form-service/form.service';

@Component({
  selector: 'lib-paris-layout-style',
  templateUrl: './paris-layout-style.component.html',
  styleUrls: ['./paris-layout-style.component.css']
})
export class ParisLayoutStyleComponent implements OnInit {

  @Input()
  ctx: FormContext;

  constructor() { }

  ngOnInit(): void {
  }

}
