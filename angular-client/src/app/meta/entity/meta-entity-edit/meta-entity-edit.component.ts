import { Component, OnInit } from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {Observable, switchMap} from 'rxjs';
import {MetaEntityService} from '../meta-entity-service/meta-entity.service';
import {MetaEntity, AttributeType, VisibilityType} from '../../../domain/meta.entity';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-meta-entity-edit',
  templateUrl: './meta-entity-edit.component.html',
  styleUrls: ['./meta-entity-edit.component.css']
})
export class MetaEntityEditComponent implements OnInit {

  public metaName: string | null;
  public metaEntity$: Observable<MetaEntity>;

  metaEntityForm = this.fb.group({
    name: [''],
    attributes: this.fb.array([]),
  })

  constructor(private fb: FormBuilder,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.metaEntity$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      return this.metaEntityService.findById(this.metaName);
    }));

    this.metaEntity$.subscribe((metaEntity) => {
      for(let i = 0; i < metaEntity.attributes.length; i++) {
        this.addBlankRow();
      }
      this.metaEntityForm.patchValue(metaEntity);
    })
  }

  get attributes() {
    return this.metaEntityForm.get('attributes') as FormArray;
  }

  addBlankRow() {
    this.attributes.push(this.createTableRow());
  }

  // addAttributeRow(attribute: MetaAttribute) {
  //   const tableRowFormGroup = this.createTableRow();
  //   tableRowFormGroup.patchValue(attribute);
  //   this.attributes.push(this.createTableRow());
  // }

  createTableRow(): FormGroup {
    return this.fb.group({
      name: [''],
      label: [''],
      description: [''],
      type: [''],
      visibility: ['']
    });
  }

  onSave() {
    const metaEntityData = this.metaEntityForm.value;
    console.log(`onSave():`, metaEntityData);

    console.log(`AttributeType: ${Object.keys(AttributeType)}`)
  }

  onCancel() {

  }

  getAttributeTypeOptions(): string[] {
    return Object.keys(AttributeType);
  }

  getVisibilityTypeOptions(): string[] {
    return Object.keys(VisibilityType);
  }
}
