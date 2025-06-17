import { Component, OnInit } from '@angular/core';
import {Observable, of, Subject, switchMap, tap} from 'rxjs';
import {ActionType, MetaRole} from '../../../domain/meta.role';
import {FormArray, UntypedFormArray, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {MetaRoleService} from '../meta-role-service/meta-role.service';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {MetaEntityService} from '../../entity/meta-entity-service/meta-entity.service';
import {MetaEntity} from '../../../domain/meta.entity';
import {MetaMenuService} from '../../menu/meta-menu-service/meta-menu.service';

@Component({
    selector: 'lib-meta-role-edit',
    templateUrl: './meta-role-edit.component.html',
    styleUrls: ['./meta-role-edit.component.css'],
    standalone: false
})
export class MetaRoleEditComponent implements OnInit {

  metaRoleName: string | null;
  metaRole$: Observable<MetaRole>;

  metaRoleForm = new UntypedFormGroup({
    name: new UntypedFormControl(''),
    group: new UntypedFormControl(''),
    inherits: new UntypedFormControl(''),
    description: new UntypedFormControl(''),
  });

  permissionsMap: Map<string, string[]> = new Map<string, string[]>();
  inheritedPermissionsMap: Map<string, string[]> = new Map<string, string[]>();

  inheritsOptions$: Observable<MetaRole[]>;

  entitySubjectOptions$: Observable<SubjectOption[]>;
  menuSubjectOptions$: Observable<SubjectOption[]>;
  specialSubjectOptions$: Observable<SubjectOption[]>;

  constructor(protected readonly metaRoleService: MetaRoleService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly metaMenuService: MetaMenuService,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router) { }

  ngOnInit(): void {
    this.metaRole$ = this.route.paramMap.pipe(switchMap((params: ParamMap) => {
      this.metaRoleName = params.get('metaRoleName');
      const obs = this.metaRoleName === '**NEW**' ? this.newMetaRole() : this.loadMetaRole();
      return obs.pipe(tap(metaRole => {
        this.metaRoleForm.patchValue(metaRole);
        this.loadPermissionsMap(metaRole);
        this.loadInheritedPermissionsMap(metaRole);
      }));
    }));

    this.inheritsOptions$ = this.metaRoleService.findAll().pipe(switchMap( (metaRoles: MetaRole[]) => {
      return of(metaRoles.filter(s => s.name !== this.metaRoleName));
    }));

    this.entitySubjectOptions$ = this.metaEntityService.findAll().pipe(switchMap( (metaEntityList: MetaEntity[]) => {
      const subjectOptions: SubjectOption[] = [];

      // subjectOptions.push({
      //   type: SubjectType.Special,
      //   name: String(ActionType.Any)
      // });

      for(const nextMetaEntity of metaEntityList) {
        if(nextMetaEntity.rootNode) {
          subjectOptions.push({
            type: SubjectType.Entity,
            name: nextMetaEntity.name
          });
        }
      }
      return of(subjectOptions);
    }));

    this.menuSubjectOptions$ = this.metaMenuService.find().pipe(switchMap((metaMenu) => {
      const subjectOptions: SubjectOption[] = [];
      for(const nextMenu of metaMenu.menuList) {
        if(nextMenu.label) {
          subjectOptions.push({
            type: SubjectType.Menu,
            name: nextMenu.label
          });
        }
      }
      return of(subjectOptions);
    }));

    this.specialSubjectOptions$ = of([
      {
        type: SubjectType.Special,
        name: String(ActionType.Any)
      },
      {
        type: SubjectType.Special,
        name: "Media"
      },
      {
        type: SubjectType.Special,
        name: "Migrate"
      }
    ])
  }

  newMetaRole() {
    return of(new MetaRole());
  }

  loadMetaRole() {
    return this.metaRoleService.findById(this.metaRoleName);
  }

  onDelete(metaRole: any) {

  }

  onCancel() {
    this.router.navigate(['/meta/role/search']);
  }

  onSave() {
    const metaRole = this.metaRoleForm.value;
    this.savePermissionsMap(metaRole);

    console.log('onSave()', metaRole);

    if(this.metaRoleName === '**NEW**') {
      this.metaRoleService.create(metaRole).subscribe(() => {
        console.log('MetaRole created.');
        this.onCancel();
      });
    }
    else {
      this.metaRoleService.update(metaRole).subscribe(() => {
        console.log('MetaRole updated.');
        this.onCancel();
      });
    }
  }

  get ActionTypeOptions() {
    return Object.keys(ActionType);
  }

  onDropEvent($event: any, actionType: string) {
    const subject = $event as SubjectOption;
    console.log(`Subject ${subject} dropped into ${actionType}`)

    if(this.isDropAllowed(subject, actionType)){
      let permissionList = this.permissionsMap.get(actionType);
      if(!permissionList) {
        permissionList = [];
        this.permissionsMap.set(actionType, permissionList);
      }

      // If the subject is "Any" then remove all items from the list and just add the "Any" subject
      if(subject.name === ActionType.Any) {
        permissionList.length = 0;
        permissionList.push(subject.name);
      }
      else {
        // If the list already contains "Any" then it doesn't matter what you add the "Any" would take effect, so if "Any"
        // then don't need to add the subject
        const containsAny = permissionList.findIndex(s => s === ActionType.Any) >= 0;

        // If the list already contains the Subject then don't add it a second time
        const containsSubject = permissionList.findIndex(s => s === subject.name) >= 0;

        // If any of the inherited parent roles already contains the Subject then don't add it a second time
        let parentContainsSubject = false;
        const parentPermissionList = this.inheritedPermissionsMap.get(actionType);
        if(parentPermissionList) {
          parentContainsSubject = parentPermissionList.findIndex(s => s === subject.name) >= 0;
        }

        // If everything ok, then add it now
        if(!containsAny && !containsSubject && !parentContainsSubject) {
          permissionList.push(subject.name);
        }
      }
    }
  }

  isDropAllowed(subjectOption: SubjectOption, actionType: string) {
    switch (subjectOption.type) {
      case SubjectType.Special:
        return true;
      case SubjectType.Menu:
        return actionType === ActionType.Menu;
      case SubjectType.Entity:
        return actionType !== ActionType.Menu
      default:
        throw new Error(`Unknown subjectOption and actionType combination: ${JSON.stringify(subjectOption)}, ${actionType}`);
    }
  }

  removePermission(actionType: string, idx: number) {
    let permissionList = this.permissionsMap.get(actionType);
    if(permissionList) {
      permissionList.splice(idx, 1);
    }
  }

  private loadPermissionsMap(metaRole: MetaRole) {
    this.addPermissions(metaRole, this.permissionsMap);
  }

  private loadInheritedPermissionsMap(metaRole: MetaRole){
    const nextMap = new Map<string, string[]>();
    if(metaRole.inherits) {
      this.loadParentPermissions(metaRole.inherits, nextMap);
    }
    this.inheritedPermissionsMap = nextMap;
  }

  private loadParentPermissions(parentRole: string, nextMap: Map<string, string[]>) {
    this.metaRoleService.findById(parentRole).subscribe((parentRole) => {
      this.addPermissions(parentRole, nextMap);
      if(parentRole.inherits) {
        this.loadParentPermissions(parentRole.inherits, nextMap);
      }
    })
  }

  private addPermissions(metaRole: MetaRole, permissionMap: Map<string, string[]>) {
    // load the UI permissionsMap with data from the MetaRole
    if(metaRole.permissions) {
      for(const nextPermission of metaRole.permissions) {
        let permissionList = permissionMap.get(nextPermission.action);
        if(!permissionList) {
          permissionList = [];
          permissionMap.set(nextPermission.action, permissionList);
        }
        permissionList.push(nextPermission.subject);
      }
    }
  }

  private savePermissionsMap(metaRole: MetaRole) {
    // update the MetaRole document with the latest values from the UI
    metaRole.permissions = [];
    for(const actionType of Object.values(ActionType)) {
      const permissionsList = this.permissionsMap.get(actionType);
      if(permissionsList) {
        for(const subject of permissionsList) {
          metaRole.permissions.push({
            action: actionType,
            subject: subject,
          });
        }
      }
    }
  }

  get SubjectType() {
    return SubjectType;
  }
}

export enum SubjectType {
  Special = 'Special',
  Entity = 'Entity',
  Menu = 'Menu'
}

export class SubjectOption {
  type: SubjectType;
  name: string;
}
