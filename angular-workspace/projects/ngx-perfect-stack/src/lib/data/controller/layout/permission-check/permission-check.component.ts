import {Component, Input, OnInit} from '@angular/core';
import {ActionType} from '../../../../domain/meta.role';
import {AuthorizationService} from '../../../../authentication/authorization.service';
import {FormContext} from '../../../data-edit/form-service/form.service';
import {AbstractControl, FormGroup} from "@angular/forms";

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
export class PermissionCheckComponent implements OnInit {

  @Input()
  action: ActionType;

  @Input()
  ctx: FormContext;

  @Input()
  enabledIf = true;


  private _subject: string | null;

  displayEnabled = false;
  dataSource = '';

  constructor(protected readonly authorizationService: AuthorizationService) { }

  ngOnInit(): void {
    if(this.ctx) {
      // WARNING: Same logic in DateEditComponent
      const abstractControl = this.ctx.formMap.values().next().value;
      if(abstractControl instanceof FormGroup) {
        const formGroup = abstractControl as FormGroup;
        const dataSourceControl = formGroup.controls['data_source'] as any;
        this.dataSource = dataSourceControl?.value;
        this.checkPermission();
      }
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
    if(this.enabledIf) {
      this.displayEnabled = this.authorizationService.checkPermission(this.action, this._subject, this.dataSource);
    }
    else {
      this.displayEnabled = !this.authorizationService.checkPermission(this.action, this._subject, this.dataSource);
    }
  }
}
