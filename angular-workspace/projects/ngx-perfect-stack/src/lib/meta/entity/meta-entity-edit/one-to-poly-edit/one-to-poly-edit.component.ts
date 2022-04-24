import {Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {DiscriminatorAttribute, MetaEntity} from '../../../../domain/meta.entity';
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

  metaEntityOptions$: Observable<MetaEntity[]>;
  discriminatorValueOptions$: Observable<any>;

  constructor(private fb: FormBuilder,
              protected readonly dataService: DataService,
              protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.metaEntityOptions$ = this.metaEntityService.findAll();
    if(this.formGroup.value) {
      const discriminator = this.formGroup.value as DiscriminatorAttribute;
      console.log(`ngOnInit with ${discriminator.discriminatorType}`);
      this.onDiscriminatorTypeChange(discriminator.discriminatorType);
    }
  }

  get mappings(): FormArray {
    return this.formGroup.controls['entityMappingList'] as FormArray;
  }

  getMappingAt(idx: number) {
    return this.mappings.at(idx) as FormGroup;
  }

  onAddEntityMapping() {
    this.mappings.push(OneToPolyEditComponent.createTableRow(this.fb));
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
    console.log(`onDiscriminatorTypeChange() - ${discriminatorType}`);
    this.discriminatorValueOptions$ = this.dataService.findAll(discriminatorType, '', 1, 100);
  }
}
