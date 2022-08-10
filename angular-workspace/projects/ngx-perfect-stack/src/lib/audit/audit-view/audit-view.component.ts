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

@Component({
  selector: 'lib-audit-view',
  templateUrl: './audit-view.component.html',
  styleUrls: ['./audit-view.component.css']
})
export class AuditViewComponent implements OnInit {

  @Input()
  mode: string;

  @Input()
  entityId: string | null;

  showRecords = false;

  auditRecords$: Observable<Audit[]>;

  private zoneId = ZoneId.of('Pacific/Auckland');
  private displayFormatter: DateTimeFormatter;

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly auditService: AuditService) {
    Locale.getAvailableLocales();
    this.displayFormatter = DateTimeFormatter.ofPattern(this.stackConfig.dateTimeFormat).withLocale(Locale.US);
  }

  ngOnInit(): void {
    if(this.entityId) {
      this.auditRecords$ = this.auditService.findAll(this.entityId);
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
