import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ActionType} from '../../../../domain/meta.role';
import {AuthorizationService} from '../../../../authentication/authorization.service';
import {FormContext} from '../../../data-edit/form-service/form.service';
import {FormGroup} from "@angular/forms";

/**
 * This PermissionCheckComponent makes it easy to control the display of a component based on the current User's
 * permissions. If the current user has the required permissions then the nested child component will be displayed.
 */
@Component({
    selector: 'lib-permission-check',
    templateUrl: './permission-check.component.html',
    styleUrls: ['./permission-check.component.css'],
    standalone: false
})
export class PermissionCheckComponent implements OnInit, OnChanges {

  @Input()
  action: ActionType;

  @Input()
  ctx: FormContext;

  @Input()
  enabledIf = true;

  @Input()
  subject: string | null;

  displayEnabled = false;
  dataSource = '';

  constructor(protected readonly authorizationService: AuthorizationService) { }

  ngOnInit(): void {
    this.updateDataSource();
    this.checkPermission();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateDataSource();
    this.checkPermission();
  }

  private updateDataSource(): void {
    if(this.ctx && this.ctx.formMap) {
      // WARNING: Same logic in DateEditComponent
      const abstractControl = this.ctx.formMap.values().next().value;
      if(abstractControl instanceof FormGroup) {
        const formGroup = abstractControl as FormGroup;
        const dataSourceControl = formGroup.controls['data_source'] as any;
        this.dataSource = dataSourceControl?.value ?? '';
      }
    }
  }

  checkPermission() {
    if(this.enabledIf) {
      this.displayEnabled = this.authorizationService.checkPermission(this.action, this.subject, this.dataSource);
    }
    else {
      this.displayEnabled = !this.authorizationService.checkPermission(this.action, this.subject, this.dataSource);
    }
  }
}
