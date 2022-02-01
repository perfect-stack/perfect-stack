import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {Observable, of, switchMap} from 'rxjs';
import {MetaEntityService} from '../meta-entity-service/meta-entity.service';
import {
  MetaEntity,
  AttributeType,
  VisibilityType,
  EntityType,
  ComparisonOperator,
  MetaAttribute
} from '../../../domain/meta.entity';
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
    name: ['', Validators.required],
    type: ['', Validators.required],
    attributes: this.fb.array([]),
  }, {validators: [uniqueNameValidator]});

  public metaEntityOptions$: Observable<MetaEntity[]>

  constructor(private fb: FormBuilder,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.metaEntity$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      return this.metaName === '**NEW**' ? of(new MetaEntity()) : this.metaEntityService.findById(this.metaName);
    }));

    this.metaEntity$.subscribe((metaEntity) => {
      for(let i = 0; i < metaEntity.attributes.length; i++) {
        this.addBlankRow();
      }
      this.metaEntityForm.patchValue(metaEntity);
    });

    this.metaEntityOptions$ = this.metaEntityService.findAll();
  }

  get attributes() {
    return this.metaEntityForm.get('attributes') as FormArray;
  }

  getAttributeAt(idx: number) {
    return this.attributes.at(idx) as FormGroup;
  }

  addBlankRow() {
    this.attributes.push(this.createTableRow());
  }

  createTableRow(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      label: ['', Validators.required],
      description: [''],
      type: [AttributeType.Text],
      visibility: [VisibilityType.Visible],
      comparisonOperator: [''],
      relationshipTarget: [''],
    });
  }

  onSave(metaEntity: MetaEntity) {
    const metaEntityData = this.metaEntityForm.value;

    console.log(`onSave():`, metaEntityData);
    if(this.metaName === '**NEW**') {
      this.metaEntityService.create(metaEntityData).subscribe(() => {
        console.log('create complete');
        this.router.navigate(['meta/entity/view', metaEntityData.name]);
      });
    }
    else {
      this.metaEntityService.update(metaEntityData).subscribe(() => {
        console.log('update complete');
        this.router.navigate(['meta/entity/view', metaEntityData.name]);
      });
    }
  }

  onCancel() {
    if(this.metaName === '**NEW**') {
      this.router.navigate(['meta/entity/search'])
    }
    else {
      this.router.navigate(['meta/entity/view', this.metaName]);
    }
  }

  getAttributeTypeOptions(): string[] {
    return Object.keys(AttributeType);
  }

  getVisibilityTypeOptions(): string[] {
    return Object.keys(VisibilityType);
  }

  getEntityTypeOptions() {
    return Object.keys(EntityType);
  }

  getComparisonOperatorOptions() {
    return Object.keys(ComparisonOperator);
  }

  onAddAttribute(count: number) {
    for(let i = 0; i < count; i++) {
      this.addBlankRow();
    }
  }

  onLabelKeyup(group: AbstractControl) {
    const formGroup = group as FormGroup;
    const label = formGroup.controls['label'].value;

    function toEntityNameFromLabel(label: string) {
      return label ? label.toLowerCase().replace(/ /g, '_') : label;
    }

    const name = toEntityNameFromLabel(label);
    formGroup.controls['name'].setValue(name);
  }

  isRelationshipType(index: any) {
    const row = this.attributes.at(index) as FormGroup;
    const type = row.controls['type'].value;
    const relationshipTypes = [AttributeType.OneToMany, AttributeType.OneToOne, AttributeType.ManyToOne];
    return relationshipTypes.includes(type);
  }
}


export const uniqueNameValidator = (control: AbstractControl): ValidationErrors | null => {

  const attributes = control.get('attributes') as FormArray;
  for(const sourceRowControls of attributes.controls) {
    const sourceAttribute = sourceRowControls.value as MetaAttribute;
    const labelControl = sourceRowControls.get('label');

    // This next little block isn't really about this validation rule, it's more about removing any previous
    // error state from earlier invocations so that it doesn't matter which of the non-unique names the user
    // actually corrects, they'll both get corrected. Due to how the Angular API works, you can't just delete
    // one error, you have to "set" the error object/map again.
    const errors = labelControl?.errors;
    if(errors && errors['label']) {
      delete errors['label'];
      if(Object.keys(errors).length > 0) {
        labelControl?.setErrors(errors);
      }
      else {
        labelControl?.setErrors(null);
      }
    }

    for (const targetRowControls of attributes.controls) {
      if (sourceRowControls !== targetRowControls) {
        const targetAttribute = targetRowControls.value as MetaAttribute;
        if (sourceAttribute.name && sourceAttribute.name === targetAttribute.name) {
          labelControl?.setErrors({'label': {errorText: 'Attribute name must be unique'}});
        }
      }
    }
  }

  return null;
}
