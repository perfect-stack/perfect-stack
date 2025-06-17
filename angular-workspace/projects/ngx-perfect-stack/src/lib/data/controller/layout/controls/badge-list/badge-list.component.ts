import {Component, Input, OnInit} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {Cell} from '../../../../../domain/meta.page';

@Component({
    selector: 'lib-badge-list',
    templateUrl: './badge-list.component.html',
    styleUrls: ['./badge-list.component.css'],
    standalone: false
})
export class BadgeListComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  cell: Cell;

  constructor() { }

  ngOnInit(): void {
  }

  getBadgeValues(): string[] {
    const value = this.formGroup.controls[this.attribute.name].value;
    const split = value.split(',');
    const badgeValues = [];
    for(const nextSplitValue of split) {
      if(nextSplitValue) {
        badgeValues.push(nextSplitValue);
      }
    }
    return badgeValues;
  }

}
