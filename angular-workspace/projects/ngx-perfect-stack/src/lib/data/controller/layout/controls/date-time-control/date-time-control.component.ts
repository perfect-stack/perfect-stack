import {Component, Inject, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {DateTimeFormatter, ZonedDateTime, ZoneId} from '@js-joda/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';
import '@js-joda/locale_en';
import '@js-joda/timezone';

@Component({
  selector: 'lib-date-time-control',
  templateUrl: './date-time-control.component.html',
  styleUrls: ['./date-time-control.component.css']
})
export class DateTimeControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  formGroup: FormGroup;

  @Input()
  name: string;

  dateTimeValue: string;

  constructor(@Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig) { }

  ngOnInit(): void {
    if(this.mode !== 'edit') {
      const formControl = this.formGroup.controls[this.name];
      const databaseValue = formControl.value;
      if(databaseValue) {
        console.log(`DateTimeControlComponent: databaseValue = ${databaseValue}`);
        let zonedDateTime = ZonedDateTime.parse(databaseValue);
        console.log(`DateTimeControlComponent: zonedDateTime`, zonedDateTime );
        const zoneId = ZoneId.of('Pacific/Auckland');
        console.log(`DateTimeControlComponent: zoneId`, zoneId );
        if(zoneId) {
          zonedDateTime = zonedDateTime.withZoneSameInstant(zoneId);
          this.dateTimeValue = DateTimeFormatter.ofPattern(this.stackConfig.dateTimeFormat).format(zonedDateTime);
          console.log(`DateTimeControlComponent: dateTimeValue`, this.dateTimeValue );
        }
        else {
          console.error('Unable to load timezone - check that Timezone library has been imported');
        }
      }
    }
  }

}
