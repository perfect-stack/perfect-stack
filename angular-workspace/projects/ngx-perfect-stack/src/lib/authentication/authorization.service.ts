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

  /*loadPermissions(): Observable<Map<string, string[]>> {
    return this.metaRoleService.findAll().pipe(switchMap((metaRoleList) => {
      const permissionMap = new Map<string, string[]>();
      for (const nextMetaRole of metaRoleList) {
        const groupNames = nextMetaRole.group.split(',');
        for (const nextGroupName of groupNames) {
          permissionMap.set(
            nextGroupName,
            this.loadPermissionsForRole(nextMetaRole, metaRoleList),
          );
        }
      }

      return of(permissionMap);
    }));
  }*/

  loadPermissionsFromMetaRoleList(metaRoleList: MetaRole[]) {
    const permissionMap = new Map<string, string[]>();
    for (const nextMetaRole of metaRoleList) {
      // calculate the permissions of the current Role document (we can use this more than once below)
      const rolePermissions = this.loadPermissionsForRole(nextMetaRole, metaRoleList);

      const groupNames = nextMetaRole.group.split(',');
      for (const nextGroupName of groupNames) {
        // get existing groupPermissions (if any)
        const existingGroupPermissions = permissionMap.has(nextGroupName) ? permissionMap.get(nextGroupName) : [];

        // the new group permissions is the intersection of any existing permissions from other roles and the
        // permissions from this role
        const newGroupPermissions = this.mergePermissions(existingGroupPermissions!, rolePermissions);

        // update the map and overwrite any existing value
        permissionMap.set( nextGroupName, newGroupPermissions);
      }
    }
    return permissionMap;
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

    for (const nextPermission of metaRole.permissions) {
      const permit = `${nextPermission.action}.${nextPermission.subject}`;
      if (!this.alreadyExists(permit, permissions)) {
        permissions.push(permit);
      }
    }

    return permissions;
  }

  private alreadyExists(permission: string, permissions: string[]): boolean {
    return permissions.findIndex((s) => s === permission) >= 0;
  }

  checkPermission(
    action: string,
    subject: string | null,
  ): boolean {
    // For both the user and permissionMap$ streams below we depend on the latest value which may be null but
    // that's ok because if there is no current user logged in then the right answer is to return false.
    if(subject) {
      const user = this.authenticationService.user$.getValue();
      if(user) {
        const userGroups = user.getGroups();
        const permissionMap = this.permissionMap$.getValue();
        if (permissionMap) {
          return this.checkPermissionWithMap(userGroups, permissionMap, action, subject);
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
          permitted = this.isPermittedMatch(
            action,
            subject,
            permitAction,
            permitSubject,
          );
        }
      }
    }

    console.log(`CheckPermission: ${action}.${subject} for ${userGroups} = ${permitted}`);
    return permitted;
  }

  private isPermittedMatch(
    action: string,
    subject: string,
    permitAction: string,
    permitSubject: string,
  ) {
    return (
      action === permitAction &&
      (subject === permitSubject || permitSubject === 'Any')
    );
  }

  /**
   * Add the two arrays of permissions together and do not include duplicates.
   *
   * https://codeburst.io/how-to-merge-arrays-without-duplicates-in-javascript-91c66e7b74cf
   * @param existingGroupPermissions
   * @param rolePermissions
   * @private
   */
  private mergePermissions(existingGroupPermissions: string[], rolePermissions: string[]): string[] {
    return [...new Set([...existingGroupPermissions, ...rolePermissions])];
  }
}
