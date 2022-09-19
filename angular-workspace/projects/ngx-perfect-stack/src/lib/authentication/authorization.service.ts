import { MetaRoleService } from '../meta/role/meta-role-service/meta-role.service';
import { MetaRole } from '../domain/meta.role';
import {BehaviorSubject, Observable, of, switchMap} from 'rxjs';
import {Injectable} from '@angular/core';
import {AuthenticationService} from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  permissionMap$ = new BehaviorSubject<Map<string, string[]>|null>(null);

  constructor(protected readonly metaRoleService: MetaRoleService,
              protected readonly authenticationService: AuthenticationService) {
    this.loadPermissions().subscribe((permissionMap) => {
      console.log('GOT permissionMap');
      this.permissionMap$.next(permissionMap);
    });
  }

  loadPermissions(): Observable<Map<string, string[]>> {
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
          return false;
        }
      }
      else {
        return false;
      }
    }
    else {
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
}
