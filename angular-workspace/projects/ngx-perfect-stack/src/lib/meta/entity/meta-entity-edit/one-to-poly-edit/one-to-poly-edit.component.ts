import {Component, Input, OnInit} from '@angular/core';
import {UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {MetaAttribute, MetaEntity} from '../../../../domain/meta.entity';
import {MetaEntityService} from '../../meta-entity-service/meta-entity.service';
import {DataService} from '../../../../data/data-service/data.service';

@Component({
    selector: 'lib-one-to-poly-edit',
    templateUrl: './one-to-poly-edit.component.html',
    styleUrls: ['./one-to-poly-edit.component.css'],
    standalone: false
})
export class OneToPolyEditComponent implements OnInit {

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  metaEntityOptions: MetaEntity[];

  discriminatorFormGroup: UntypedFormGroup;
  discriminatorValueOptions$: Observable<any>;

  constructor(private fb: UntypedFormBuilder,
              protected readonly dataService: DataService,
              protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    if(this.formGroup) {
      const metaAttribute: MetaAttribute = this.formGroup.value;
      OneToPolyEditComponent.addDiscriminatorFormGroup(this.fb, this.formGroup, metaAttribute);

      this.discriminatorFormGroup = this.formGroup.get('discriminator') as UntypedFormGroup;

      if(metaAttribute.discriminator && metaAttribute.discriminator.discriminatorType) {
        this.onDiscriminatorTypeChange(metaAttribute.discriminator.discriminatorType);
      }
    }
  }

  get mappings(): UntypedFormArray {
    return this.discriminatorFormGroup.controls['entityMappingList'] as UntypedFormArray;
  }

  getMappingAt(idx: number) {
    return this.mappings.at(idx) as UntypedFormGroup;
  }

  onAddEntityMapping() {
    this.mappings.push(OneToPolyEditComponent.createTableRow(this.fb));
  }

  static addDiscriminatorFormGroup(fb: UntypedFormBuilder, formGroup: UntypedFormGroup, metaAttribute: MetaAttribute) {
    const discriminatorFormGroup = fb.group({
      discriminatorName: [''],
      discriminatorType: [''],
      entityMappingList: fb.array([]),
    });

    const entityMappingListFormArray = discriminatorFormGroup.controls['entityMappingList'] as UntypedFormArray;
    if(metaAttribute && metaAttribute.discriminator && metaAttribute.discriminator.entityMappingList) {
      const rowCountNeeded = metaAttribute.discriminator.entityMappingList.length;
      for(let i = 0; i < rowCountNeeded; i++) {
        entityMappingListFormArray.push(OneToPolyEditComponent.createTableRow(fb));
      }
    }

    formGroup.addControl('discriminator', discriminatorFormGroup);
  }

  static createTableRow(fb: UntypedFormBuilder): UntypedFormGroup {
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
