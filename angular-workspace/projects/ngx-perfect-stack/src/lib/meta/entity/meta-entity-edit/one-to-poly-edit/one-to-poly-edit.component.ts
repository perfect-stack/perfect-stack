import {Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {MetaAttribute, MetaEntity} from '../../../../domain/meta.entity';
import {MetaEntityService} from '../../meta-entity-service/meta-entity.service';
import {DataService} from '../../../../data/data-service/data.service';

@Component({
  selector: 'lib-one-to-poly-edit',
  templateUrl: './one-to-poly-edit.component.html',
  styleUrls: ['./one-to-poly-edit.component.css']
})
export class OneToPolyEditComponent implements OnInit {

  @Input()
  formGroup: FormGroup;

  @Input()
  metaEntityOptions: MetaEntity[];

  discriminatorFormGroup: FormGroup;
  discriminatorValueOptions$: Observable<any>;

  constructor(private fb: FormBuilder,
              protected readonly dataService: DataService,
              protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    if(this.formGroup) {
      const metaAttribute: MetaAttribute = this.formGroup.value;
      OneToPolyEditComponent.addDiscriminatorFormGroup(this.fb, this.formGroup, metaAttribute);

      this.discriminatorFormGroup = this.formGroup.get('discriminator') as FormGroup;

      if(metaAttribute.discriminator && metaAttribute.discriminator.discriminatorType) {
        this.onDiscriminatorTypeChange(metaAttribute.discriminator.discriminatorType);
      }
    }
  }

  get mappings(): FormArray {
    return this.discriminatorFormGroup.controls['entityMappingList'] as FormArray;
  }

  getMappingAt(idx: number) {
    return this.mappings.at(idx) as FormGroup;
  }

  onAddEntityMapping() {
    this.mappings.push(OneToPolyEditComponent.createTableRow(this.fb));
  }

  static addDiscriminatorFormGroup(fb: FormBuilder, formGroup: FormGroup, metaAttribute: MetaAttribute) {
    const discriminatorFormGroup = fb.group({
      discriminatorName: [''],
      discriminatorType: [''],
      entityMappingList: fb.array([]),
    });

    const entityMappingListFormArray = discriminatorFormGroup.controls['entityMappingList'] as FormArray;
    if(metaAttribute && metaAttribute.discriminator && metaAttribute.discriminator.entityMappingList) {
      const rowCountNeeded = metaAttribute.discriminator.entityMappingList.length;
      for(let i = 0; i < rowCountNeeded; i++) {
        entityMappingListFormArray.push(OneToPolyEditComponent.createTableRow(fb));
      }
    }

    formGroup.addControl('discriminator', discriminatorFormGroup);
  }

  static createTableRow(fb: FormBuilder): FormGroup {
    return fb.group({
      discriminatorValue: ['', Validators.required],
      metaEntityName: ['', Validators.required],
    });
  }

  onDeleteEntityMapping(rowIdx: number) {
    this.mappings.removeAt(rowIdx);
  }

  onDiscriminatorTypeChange(discriminatorType: string) {
    if(discriminatorType) {
      this.discriminatorValueOptions$ = this.dataService.findAll(discriminatorType, '', 1, 100);
    }
  }
}
