import {Component, Input, OnInit} from '@angular/core';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {ValidationResult} from '../../../../../domain/meta.rule';

@Component({
  selector: 'lib-validation-result-label',
  templateUrl: './validation-result-label.component.html',
  styleUrls: ['./validation-result-label.component.css']
})
export class ValidationResultLabelComponent implements OnInit {

  @Input()
  attribute: MetaAttribute;

  @Input()
  validationResult: ValidationResult;

  constructor() { }

  ngOnInit(): void {
  }

}
