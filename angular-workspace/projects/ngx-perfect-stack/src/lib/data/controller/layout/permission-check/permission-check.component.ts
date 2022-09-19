import {Component, Input, OnInit} from '@angular/core';
import {ActionType} from '../../../../domain/meta.role';
import {AuthorizationService} from '../../../../authentication/authorization.service';

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

  private _subject: string | null;

  permissionEnabled = false;

  constructor(protected readonly authorizationService: AuthorizationService) { }

  ngOnInit(): void {
  }

  get subject(): string | null {
    return this._subject;
  }

  @Input()
  set subject(value: string | null) {
    this._subject = value;
    this.permissionEnabled = this.authorizationService.checkPermission(this.action, this._subject);
  }
}
