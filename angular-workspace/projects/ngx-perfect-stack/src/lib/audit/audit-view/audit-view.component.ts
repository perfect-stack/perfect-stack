import {Component, Input, OnInit} from '@angular/core';
import {AuditService} from '../audit.service';
import {Observable} from 'rxjs';
import {Audit} from '../../domain/audit';
import {DateTimeFormatter, ZonedDateTime} from '@js-joda/core';

@Component({
  selector: 'lib-audit-view',
  templateUrl: './audit-view.component.html',
  styleUrls: ['./audit-view.component.css']
})
export class AuditViewComponent implements OnInit {

  @Input()
  entityId: string | null;

  showRecords = false;

  auditRecords$: Observable<Audit[]>;

  private displayFormat = DateTimeFormatter.ofPattern('dd-MM-yyyy HH:mm');

  constructor(protected readonly auditService: AuditService) { }

  ngOnInit(): void {
    if(this.entityId) {
      this.auditRecords$ = this.auditService.findAll(this.entityId);
    }
  }

  toDisplayTime(utc: string) {
    return utc ? ZonedDateTime.parse(utc).format(this.displayFormat): '';
  }

  toggleShowRecords() {
    this.showRecords = !this.showRecords;
  }

}
