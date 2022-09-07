import { Component, OnInit } from '@angular/core';
import {Observable, of, switchMap, tap} from 'rxjs';
import {MetaRole} from '../../../domain/meta.role';
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {MetaRoleService} from '../meta-role-service/meta-role.service';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';

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
    description: new UntypedFormControl(''),
  });

  constructor(protected readonly metaRoleService: MetaRoleService,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router) { }

  ngOnInit(): void {
    this.metaRole$ = this.route.paramMap.pipe(switchMap((params: ParamMap) => {
      this.metaRoleName = params.get('metaRoleName');
      const obs = this.metaRoleName === '**NEW**' ? this.newMetaRole() : this.loadMetaRole();
      return obs.pipe(tap(metaRole => {
        this.metaRoleForm.patchValue(metaRole);
      }));
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
}
