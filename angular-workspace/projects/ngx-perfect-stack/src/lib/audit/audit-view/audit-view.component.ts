import {Component, Inject, Input, OnInit} from '@angular/core';
import {AuditService} from '../audit.service';
import {Observable} from 'rxjs';
import {Audit} from '../../domain/audit';
import {DateTimeFormatter, ZonedDateTime, ZoneId} from '@js-joda/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';

// This next import may appear to be grey and unused, but it is important because it imports the right language/words for
// when date time formats use text days and months and not just numerical values
import {Locale} from '@js-joda/locale_en';
import '@js-joda/timezone';
import {FormContext, FormControlWithAttribute} from '../../data/data-edit/form-service/form.service';
import {FormGroup} from '@angular/forms';

@Component({
    selector: 'lib-audit-view',
    templateUrl: './audit-view.component.html',
    styleUrls: ['./audit-view.component.css'],
    standalone: false
})
export class AuditViewComponent implements OnInit {

  @Input()
  ctx: FormContext;

  showRecords = false;
  auditRecords$: Observable<Audit[]>;

  //formGroup: FormGroup;
  //dataSourceControl: FormControlWithAttribute;

  private zoneId = ZoneId.of('Pacific/Auckland');
  private displayFormatter: DateTimeFormatter;

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly auditService: AuditService) {
    Locale.getAvailableLocales();
    this.displayFormatter = DateTimeFormatter.ofPattern(this.stackConfig.dateTimeFormat).withLocale(Locale.US);
  }

  ngOnInit(): void {
    if(this.ctx) {
      if(this.ctx.id) {
        this.auditRecords$ = this.auditService.findAll(this.ctx.id);
      }

      // WARNING: Same logic in DateEditComponent
      // this.formGroup = this.ctx.formMap.values().next().value;
      // this.dataSourceControl = this.formGroup.controls['data_source'] as any;
      // console.log('AUDIT: got dataSourceControl', this.dataSourceControl);
      // if(this.dataSourceControl && !this.dataSourceControl.value) {
      //   // TODO: this could upgraded to some sort of generic "default initial value" feature in the future
      //   this.dataSourceControl.setValue('KIMS');
      // }
    }
  }

  toDisplayTime(utc: string) {
    if(utc) {
      const zonedDateTime = ZonedDateTime.parse(utc).withZoneSameInstant(this.zoneId);
      return this.displayFormatter.format(zonedDateTime);
    }
    else {
      return '';
    }
  }

  toggleShowRecords() {
    this.showRecords = !this.showRecords;
  }

}
