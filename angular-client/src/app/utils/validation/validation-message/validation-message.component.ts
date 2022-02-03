import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';

@Component({
  selector: 'app-validation-message',
  templateUrl: './validation-message.component.html',
  styleUrls: ['./validation-message.component.css']
})
export class ValidationMessageComponent implements OnInit {

  @Input()
  control: AbstractControl;

  @Input()
  attributePath: string;

  constructor() { }

  ngOnInit(): void {
  }

}
