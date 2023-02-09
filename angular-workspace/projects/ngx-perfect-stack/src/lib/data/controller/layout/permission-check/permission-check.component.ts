import {Component, Input, OnInit} from '@angular/core';
import {ActionType} from '../../../../domain/meta.role';
import {AuthorizationService} from '../../../../authentication/authorization.service';
import {FormContext} from '../../../data-edit/form-service/form.service';

/**
 * This PermissionCheckComponent makes it easy to control the display of a component based on the current User's
 * permissions. If the current user has the required permissions then the nested child component will be displayed.
 */
@Component({
  selector: 'lib-permission-check',
  templateUrl: './permission-check.component.html',
  styleUrls: ['./permission-check.component.css']
})
export class PermissionCheckComponent implements OnInit {

  @Input()
  action: ActionType;

  @Input()
  ctx: FormContext;

  private _subject: string | null;

  permissionEnabled = false;
  dataSource = '';

  constructor(protected readonly authorizationService: AuthorizationService) { }

  ngOnInit(): void {
    if(this.ctx) {
      // WARNING: Same logic in DateEditComponent
      const formGroup = this.ctx.formMap.values().next().value;
      const dataSourceControl = formGroup.controls['data_source'] as any;
      this.dataSource = dataSourceControl.value;
      console.log('PermissionCheck: got dataSource', this.dataSource);
      this.checkPermission();
    }
  }

  get subject(): string | null {
    return this._subject;
  }

  @Input()
  set subject(value: string | null) {
    this._subject = value;
    this.checkPermission();
  }

  checkPermission() {
    this.permissionEnabled = this.authorizationService.checkPermission(this.action, this._subject, this.dataSource);
  }
}
