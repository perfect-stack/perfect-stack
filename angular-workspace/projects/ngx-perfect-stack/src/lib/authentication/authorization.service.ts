import { MetaRoleService } from '../meta/role/meta-role-service/meta-role.service';
import { MetaRole } from '../domain/meta.role';
import {BehaviorSubject} from 'rxjs';
import {Inject, Injectable} from '@angular/core';
import {AuthenticationService} from './authentication.service';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  permissionMap$ = new BehaviorSubject<Map<string, string[]>|null>(null);

  constructor(protected readonly metaRoleService: MetaRoleService,
              protected readonly authenticationService: AuthenticationService,
              @Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig) {

    const nextPermissionMap = this.loadPermissionsFromMetaRoleList(stackConfig.metaRoleList);
    this.permissionMap$.next(nextPermissionMap);
  }

  loadPermissionsFromMetaRoleList(metaRoleList: MetaRole[]) {
    const permissionMap = new Map<string, string[]>();
    if (!metaRoleList) {
      return permissionMap;
    }
    for (const nextMetaRole of metaRoleList) {
      // calculate the permissions of the current Role document (we can use this more than once below)
      const rolePermissions = this.loadPermissionsForRole(nextMetaRole, metaRoleList);

      const groupNames = nextMetaRole.group.split(',');
      for (const nextGroupName of groupNames) {
        // get existing groupPermissions (if any)
        const existingGroupPermissions = permissionMap.has(nextGroupName) ? permissionMap.get(nextGroupName) : [];

        // the new group permissions is union of both permission sets
        const newGroupPermissions = this.mergePermissions(existingGroupPermissions!, rolePermissions);

        // update the map and overwrite any existing value
        permissionMap.set( nextGroupName, newGroupPermissions);
      }
    }
    return permissionMap;
  }

  private mergePermissions(existingGroupPermissions: string[], rolePermissions: string[]) {
    const mergedList = Object.assign([], existingGroupPermissions);
    for (const nextPermission of rolePermissions) {
      if(!this.alreadyExists(nextPermission, mergedList)) {
        mergedList.push(nextPermission);
      }
    }
    return mergedList;
  }

  private loadPermissionsForRole(
    metaRole: MetaRole,
    metaRoleList: MetaRole[],
  ): string[] {
    let permissions: string[] = [];
    if (metaRole.inherits) {
      const parent = metaRoleList.find((s) => s.name === metaRole.inherits);
      if (parent) {
        permissions = this.loadPermissionsForRole(parent, metaRoleList);
      } else {
        console.warn(
          `Unable to find parent role ${metaRole.inherits} on MetaRole ${metaRole.name}`,
        );
      }
    }

    if (metaRole.permissions) {
      for (const nextPermission of metaRole.permissions) {
        const permit = `${nextPermission.action}.${nextPermission.subject}`;
        if (!this.alreadyExists(permit, permissions)) {
          permissions.push(permit);
        }
      }
    }

    return permissions;
  }

  private alreadyExists(permission: string, permissions: string[]): boolean {
    return permissions.findIndex((s) => s === permission) >= 0;
  }

  userInRole(roleName: string): boolean {
    if (this.stackConfig.authenticationProvider === 'None' || this.stackConfig.authenticationProvider === 'NONE') {
      return true;
    }
    const user = this.authenticationService.user$.getValue();
    if (user) {
      const userGroups = user.getGroups();
      return userGroups ? userGroups.includes(roleName) : false;
    }
    return false;
  }

  checkPermission(
    action: string,
    subject: string | null,
    dataSource = ''
  ): boolean {
    if (this.stackConfig.authenticationProvider === 'None' || this.stackConfig.authenticationProvider === 'NONE') {
      return true;
    }

    const dataSourcePermission = dataSource ? ['KIMS', 'KEA'].includes(dataSource) : true;

    // For both the user and permissionMap$ streams below we depend on the latest value which may be null but
    // that's ok because if there is no current user logged in then the right answer is to return false.
    if(subject) {
      const user = this.authenticationService.user$.getValue();
      if(user) {
        const userGroups = user.getGroups();
        const permissionMap = this.permissionMap$.getValue();
        if (permissionMap) {
          const actionSubjectPermission = this.checkPermissionWithMap(userGroups, permissionMap, action, subject);
          return actionSubjectPermission && dataSourcePermission;
        } else {
          console.log('CheckPermission: FALSE, no permissionMap');
          return false;
        }
      }
      else {
        console.log('CheckPermission: FALSE, no user');
        return false;
      }
    }
    else {
      console.log('CheckPermission: FALSE, no subject');
      return false;
    }
  }

  checkPermissionWithMap(
    userGroups: string[],
    permissionMap: Map<string, string[]>,
    action: string,
    subject: string,
  ): boolean {
    let permitted = false;
    for (let i = 0; i < userGroups.length && !permitted; i++) {
      const group = userGroups[i];
      const groupPermissions = permissionMap.get(group);
      if(groupPermissions) {
        for (let j = 0; j < groupPermissions.length && !permitted; j++) {
          const permits = groupPermissions[j].split('.');
          const permitAction = permits[0];
          const permitSubject = permits[1];
          if (this.isPermittedMatch(action, subject, permitAction, permitSubject)) {
            permitted = true;
          }
        }
      }
    }

    return permitted;
  }

  private isPermittedMatch(
    action: string,
    subject: string,
    permitAction: string,
    permitSubject: string,
  ) {
    const cleanAction = action ? action.trim().toLowerCase() : '';
    const cleanSubject = subject ? subject.trim().toLowerCase() : '';
    const cleanPermitAction = permitAction ? permitAction.trim().toLowerCase() : '';
    const cleanPermitSubject = permitSubject ? permitSubject.trim().toLowerCase() : '';

    const actionMatch = cleanAction === cleanPermitAction || cleanPermitAction === 'any';
    const subjectMatch = cleanSubject === cleanPermitSubject || cleanPermitSubject === 'any';

    return actionMatch && subjectMatch;
  }
}
