import {Component, OnInit} from '@angular/core';
import {
  AbstractControl, FormArray, FormGroup,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {Observable, of, switchMap} from 'rxjs';
import {MetaEntityService} from '../meta-entity-service/meta-entity.service';
import {
  AttributeType,
  ComparisonOperator,
  EntityType,
  MetaAttribute,
  MetaEntity,
  VisibilityType
} from '../../../domain/meta.entity';
import {ActivatedRoute, Router} from '@angular/router';
import {OneToPolyEditComponent} from './one-to-poly-edit/one-to-poly-edit.component';
import {EnumeratonEditComponent} from './enumeraton-edit/enumeraton-edit.component';
import {RuleEditDialogComponent} from './rule-edit-dialog/rule-edit-dialog.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

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
    pluralName: ['', Validators.required],
    icon: [''],
    type: ['', Validators.required],
    timestamps: [true, Validators.required],
    attributes: this.fb.array([]),
  }, {validators: [uniqueNameValidator]});

  public metaEntityOptions$: Observable<MetaEntity[]>

  constructor(private fb: UntypedFormBuilder,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              private modalService: NgbModal,
              protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.metaEntity$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      return this.metaName === '**NEW**' ? of(this.createNewMetaEntity()) : this.metaEntityService.findById(this.metaName);
    }));

    this.metaEntity$.subscribe((metaEntity: MetaEntity) => {
      for(const metaAttribute of metaEntity.attributes) {
        const formGroup = this.addBlankRow();
        if(metaAttribute.type === AttributeType.OneToPoly) {
          OneToPolyEditComponent.addDiscriminatorFormGroup(this.fb, formGroup, metaAttribute);
        }

        if(metaAttribute.type === AttributeType.Enumeration) {
          EnumeratonEditComponent.addEnumerationFormControl(this.fb, formGroup, metaAttribute);
        }

        const rulesFormArray = formGroup.controls['rules'] as FormArray;
        for(const ruleData of metaAttribute.rules) {
          rulesFormArray.push(this.createRuleDataFormGroup())
        }
      }

      this.metaEntityForm.patchValue(metaEntity);
    });

    this.metaEntityOptions$ = this.metaEntityService.findAll();
  }

  createNewMetaEntity() {
    const metaEntity = new MetaEntity();
    metaEntity.timestamps = true;
    return metaEntity;
  }

  get attributes() {
    return this.metaEntityForm.get('attributes') as UntypedFormArray;
  }

  getAttributeFormGroupAt(idx: number) {
    return this.attributes.at(idx) as UntypedFormGroup;
  }

  getAttributeAt(idx: number): MetaAttribute {
    return this.getAttributeFormGroupAt(idx).value as MetaAttribute;
  }

  addBlankRow() {
    const formGroup = this.createTableRow();
    this.attributes.push(formGroup);
    return formGroup;
  }

  createTableRow(): UntypedFormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      label: ['', Validators.required],
      description: [''],
      unitOfMeasure: [''],
      scale: [''],
      type: [AttributeType.Text],
      visibility: [VisibilityType.Visible],
      comparisonField: [''],
      comparisonOperator: [''],
      relationshipTarget: [''],
      typeaheadSearch: [[]],
      rules: this.fb.array([])
      // discriminator: [{}]  // Don't add this one here, the way the ngOnInit() in OneToPolyEditComponent works means this will be done when it is needed
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

  attributeHasRuleData(idx: number) {
    const attribute = this.getAttributeAt(idx);
    return attribute.rules && attribute.rules.length > 0;
  }

  onAddRule(idx: number) {
    const modalRef = this.modalService.open(RuleEditDialogComponent);
    const ruleEditDialog = modalRef.componentInstance as RuleEditDialogComponent;

    const attributeFormGroup = this.getAttributeFormGroupAt(idx);
    const ruleFormArray = attributeFormGroup.controls['rules'] as FormArray;

    const ruleDataFormGroup = this.createRuleDataFormGroup();
    ruleFormArray.push(ruleDataFormGroup);
    ruleEditDialog.ruleDataFormGroup = ruleDataFormGroup;
  }

  private createRuleDataFormGroup() {
    return this.fb.group({
      type: this.fb.control(''),
      config: this.fb.control('')
    });
  }

  editRule(i: number, ri: number) {
    const modalRef = this.modalService.open(RuleEditDialogComponent);
    const ruleEditDialog = modalRef.componentInstance as RuleEditDialogComponent;

    const attributeFormGroup = this.getAttributeFormGroupAt(i);
    const ruleFormArray = attributeFormGroup.controls['rules'] as FormArray;
    const ruleDataFormGroup = ruleFormArray.at(ri) as FormGroup;
    // TODO should really edit a clone, and then only update if the user clicks update and not cancel
    ruleEditDialog.ruleDataFormGroup = ruleDataFormGroup;
  }

  removeRule(i: number, ri: number) {
    const attribute = this.getAttributeAt(i);

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
    const formGroup = group as UntypedFormGroup;
    const label = formGroup.controls['label'].value;

    function toEntityNameFromLabel(label: string) {
      return label ? label.toLowerCase().replace(/ /g, '_') : label;
    }

    const name = toEntityNameFromLabel(label);
    formGroup.controls['name'].setValue(name);
  }

  isRelationshipType(rowIdx: number) {
    const rowFormGroup = this.attributes.at(rowIdx) as UntypedFormGroup;
    const type = rowFormGroup.controls['type'].value;
    const relationshipTypes = [AttributeType.OneToMany, AttributeType.OneToOne, AttributeType.ManyToOne];
    return relationshipTypes.includes(type);
  }

  isManyToOne(rowIdx: number) {
    const rowFormGroup = this.attributes.at(rowIdx) as UntypedFormGroup;
    const type = rowFormGroup.controls['type'].value;
    return type === AttributeType.ManyToOne;
  }

  isOneToPoly(rowIdx: number) {
    const rowFormGroup = this.attributes.at(rowIdx) as UntypedFormGroup;
    const type = rowFormGroup.controls['type'].value;
    return type === AttributeType.OneToPoly;
  }

  isEnumeration(rowIdx: number) {
    const rowFormGroup = this.attributes.at(rowIdx) as UntypedFormGroup;
    const type = rowFormGroup.controls['type'].value;
    return type === AttributeType.Enumeration;
  }
}


export const uniqueNameValidator = (control: AbstractControl): ValidationErrors | null => {

  const attributes = control.get('attributes') as UntypedFormArray;
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
