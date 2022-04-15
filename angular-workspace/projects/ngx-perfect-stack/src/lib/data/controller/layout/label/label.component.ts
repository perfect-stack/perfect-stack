import {Component, Input, OnInit} from '@angular/core';
import {MetaAttribute} from '../../../../domain/meta.entity';

@Component({
  selector: 'lib-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.css']
})
export class LabelComponent implements OnInit {

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  constructor() { }

  ngOnInit(): void {
  }

}
