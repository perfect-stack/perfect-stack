import { Injectable, Logger } from '@nestjs/common';
import { MetaRoleService } from '../meta/meta-role/meta-role.service';
import { MetaRole } from '../domain/meta.role';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(protected readonly metaRoleService: MetaRoleService) {}

  async loadPermissions(): Promise<Map<string, string[]>> {
    const metaRoleList = await this.metaRoleService.findAll();
    const permissionMap = this.loadPermissionsFromMetaRoleList(metaRoleList);
    return permissionMap;
  }

  loadPermissionsFromMetaRoleList(metaRoleList: MetaRole[]) {
    const permissionMap = new Map<string, string[]>();
    for (const nextMetaRole of metaRoleList) {
      // calculate the permissions of the current Role document (we can use this more than once below)
      const rolePermissions = this.loadPermissionsForRole(
        nextMetaRole,
        metaRoleList,
      );

      const groupNames = nextMetaRole.group.split(',');
      for (const nextGroupName of groupNames) {
        // get existing groupPermissions (if any)
        const existingGroupPermissions = permissionMap.has(nextGroupName)
          ? permissionMap.get(nextGroupName)
          : [];

        // the new group permissions is the intersection of any existing permissions from other roles and the
        // permissions from this role
        const newGroupPermissions = this.mergePermissions(
          existingGroupPermissions!,
          rolePermissions,
        );

        // update the map and overwrite any existing value
        permissionMap.set(nextGroupName, newGroupPermissions);
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
        this.logger.warn(
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
      if (groupPermissions) {
        console.log(`Group Permissions: ${JSON.stringify(groupPermissions)}`);
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

    console.log(
      `CheckPermission: ${action}.${subject} for ${userGroups} = ${permitted}`,
    );
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
  private mergePermissions(
    existingGroupPermissions: string[],
    rolePermissions: string[],
  ): string[] {
    return [...new Set([...existingGroupPermissions, ...rolePermissions])];
  }
}
