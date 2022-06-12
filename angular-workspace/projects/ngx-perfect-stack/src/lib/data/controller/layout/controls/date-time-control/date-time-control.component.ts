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
        console.log(`DateTimeControlComponent-1: databaseValue = ${databaseValue}`);
        let zonedDateTime = ZonedDateTime.parse(databaseValue);
        console.log(`DateTimeControlComponent-2: zonedDateTime`, zonedDateTime );
        const zoneId = ZoneId.of('Pacific/Auckland');
        console.log(`DateTimeControlComponent-3: zoneId`, zoneId );
        if(zoneId) {
          zonedDateTime = zonedDateTime.withZoneSameInstant(zoneId);
          console.log(`DateTimeControlComponent-4: zonedDateTime`, zonedDateTime );
          const dateTimeFormat = this.stackConfig.dateTimeFormat;
          console.log(`DateTimeControlComponent-5: dateTimeFormat`, dateTimeFormat );
          this.dateTimeValue = DateTimeFormatter.ofPattern(dateTimeFormat).format(zonedDateTime);
          console.log(`DateTimeControlComponent-6: dateTimeValue`, this.dateTimeValue );
        }
        else {
          console.error('Unable to load timezone - check that Timezone library has been imported');
        }
      }
    }
  }

}
