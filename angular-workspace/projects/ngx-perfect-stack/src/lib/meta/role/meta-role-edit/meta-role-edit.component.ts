import { Component, OnInit } from '@angular/core';
import {Observable, of, switchMap, tap} from 'rxjs';
import {ActionType, MetaRole} from '../../../domain/meta.role';
import {FormArray, UntypedFormArray, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {MetaRoleService} from '../meta-role-service/meta-role.service';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {MetaEntityService} from '../../entity/meta-entity-service/meta-entity.service';
import {MetaEntity} from '../../../domain/meta.entity';

@Component({
  selector: 'lib-meta-role-edit',
  templateUrl: './meta-role-edit.component.html',
  styleUrls: ['./meta-role-edit.component.css']
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

  inheritsOptions$: Observable<MetaRole[]>;
  subjectOptions$: Observable<string[]>;

  constructor(protected readonly metaRoleService: MetaRoleService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router) { }

  ngOnInit(): void {
    this.metaRole$ = this.route.paramMap.pipe(switchMap((params: ParamMap) => {
      this.metaRoleName = params.get('metaRoleName');
      const obs = this.metaRoleName === '**NEW**' ? this.newMetaRole() : this.loadMetaRole();
      return obs.pipe(tap(metaRole => {
        this.metaRoleForm.patchValue(metaRole);
        this.loadPermissionsMap(metaRole);
      }));
    }));

    this.inheritsOptions$ = this.metaRoleService.findAll().pipe(switchMap( (metaRoles: MetaRole[]) => {
      return of(metaRoles.filter(s => s.name !== this.metaRoleName));
    }));

    this.subjectOptions$ = this.metaEntityService.findAll().pipe(switchMap( (metaEntityList: MetaEntity[]) => {
      const subjectOptions: string[] = [];
      subjectOptions.push(String(ActionType.Any));
      for(const nextMetaEntity of metaEntityList) {
        if(nextMetaEntity.rootNode) {
          subjectOptions.push(nextMetaEntity.name);
        }
      }
      return of(subjectOptions);
    }));
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
    const subject = $event as string;
    console.log(`Subject ${subject} dropped into ${actionType}`)

    let permissionList = this.permissionsMap.get(actionType);
    if(!permissionList) {
      permissionList = [];
      this.permissionsMap.set(actionType, permissionList);
    }

    // If the subject is "Any" then remove all items from the list and just add the "Any" subject
    if(subject === ActionType.Any) {
      permissionList.length = 0;
      permissionList.push(subject);
    }
    else {
      // If the list already contains "Any" then it doesn't matter what you add the "Any" would take effect, so if "Any"
      // then don't need to add the subject
      const containsAny = permissionList.findIndex(s => s === ActionType.Any) >= 0;

      // If the list already contains the Subject then don't add it a second time
      const containsSubject = permissionList.findIndex(s => s === subject) >= 0;
      if(!containsAny && !containsSubject) {
        permissionList.push(subject);
      }
    }
  }

  removePermission(actionType: string, idx: number) {
    let permissionList = this.permissionsMap.get(actionType);
    if(permissionList) {
      permissionList.splice(idx, 1);
    }
  }

  private loadPermissionsMap(metaRole: MetaRole) {
    // load the UI permissionsMap with data from the MetaRole
    if(metaRole.permissions) {
      for(const nextPermission of metaRole.permissions) {
        let permissionList = this.permissionsMap.get(nextPermission.action);
        if(!permissionList) {
          permissionList = [];
          this.permissionsMap.set(nextPermission.action, permissionList);
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
}
