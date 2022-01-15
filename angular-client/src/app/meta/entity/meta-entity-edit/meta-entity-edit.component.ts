import { Component, OnInit } from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable, of, switchMap} from 'rxjs';
import {MetaEntityService} from '../meta-entity-service/meta-entity.service';
import {MetaEntity, AttributeType, VisibilityType, EntityType, ComparisonOperator} from '../../../domain/meta.entity';
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
  });

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
    })
  }

  get attributes() {
    return this.metaEntityForm.get('attributes') as FormArray;
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
}
