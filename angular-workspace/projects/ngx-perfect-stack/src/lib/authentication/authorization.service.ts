import { MetaRoleService } from '../meta/role/meta-role-service/meta-role.service';
import { MetaRole } from '../domain/meta.role';
import {Observable, of, switchMap} from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  constructor(protected readonly metaRoleService: MetaRoleService) {}

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

  async checkPermission(
    userGroups: string[],
    permissionMap: Map<string, string[]>,
    action: string,
    subject: string,
  ): Promise<boolean> {
    let foundMatch = false;
    for (let i = 0; i < userGroups.length && !foundMatch; i++) {
      const group = userGroups[i];
      const groupPermissions = permissionMap.get(group);
      if(groupPermissions) {
        for (let j = 0; j < groupPermissions.length && !foundMatch; j++) {
          const permits = groupPermissions[j].split('.');
          const permitAction = permits[0];
          const permitSubject = permits[1];
          foundMatch = this.isPermittedMatch(
            action,
            subject,
            permitAction,
            permitSubject,
          );

          if (foundMatch) {
            console.log(`FOUND: ${groupPermissions[j]}`);
            return true;
          }
        }
      }
    }

    if (!foundMatch) {
      console.log(`NOT FOUND: ${action}.${subject}`);
      return false;
    } else {
      throw new Error(
        'Unexpected code path. Should have returned from method by now',
      );
    }
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
