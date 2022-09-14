import { Injectable, Logger } from '@nestjs/common';
import { MetaRoleService } from '../meta/meta-role/meta-role.service';
import { MetaRole } from '../domain/meta.role';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(protected readonly metaRoleService: MetaRoleService) {}

  async loadPermissions(): Promise<Map<string, string[]>> {
    const permissionMap = new Map<string, string[]>();
    const metaRoleList = await this.metaRoleService.findAll();
    for (const nextMetaRole of metaRoleList) {
      const groupNames = nextMetaRole.group.split(',');
      for (const nextGroupName of groupNames) {
        permissionMap.set(
          nextGroupName,
          this.loadPermissionsForRole(nextMetaRole, metaRoleList),
        );
      }
    }

    return permissionMap;
  }

  loadPermissionsForRole(
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

  alreadyExists(permission: string, permissions: string[]): boolean {
    return permissions.findIndex((s) => s === permission) >= 0;
  }

  dumpPermissions(permissions: Map<string, string[]>) {
    for (const nextKey of permissions.keys()) {
      this.logger.log(
        `${nextKey}: ${JSON.stringify(permissions.get(nextKey))}`,
      );
    }
  }

  async checkPermission(
    userGroups: string[],
    action: string,
    subject: string,
  ): Promise<boolean> {
    const permissionMap = await this.loadPermissions();
    this.dumpPermissions(permissionMap);

    let foundMatch = false;
    for (let i = 0; i < userGroups.length && !foundMatch; i++) {
      const group = userGroups[i];
      const groupPermissions = permissionMap.get(group);
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
