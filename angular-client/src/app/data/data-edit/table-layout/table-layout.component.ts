import {Component, Input, OnChanges, OnInit, SimpleChange, SimpleChanges} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {Template} from '../../../domain/meta.page';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {MetaEntity} from '../../../domain/meta.entity';
import {FormService} from '../form-service/form.service';
import {CellAttribute} from '../../../meta/page/meta-page-service/meta-page.service';

@Component({
  selector: 'app-table-layout',
  templateUrl: './table-layout.component.html',
  styleUrls: ['./table-layout.component.css']
})
export class TableLayoutComponent implements OnInit, OnChanges {

  @Input()
  mode: string | null;

  @Input()
  template: Template;

  @Input()
  formGroup: FormGroup;

  @Input()
  relationshipProperty: string;

  metaEntity: MetaEntity;
  metaEntityList: MetaEntity[];

  cells: CellAttribute[][];

  constructor(protected readonly metaEntityService: MetaEntityService,
              protected readonly formService: FormService,
              private fb: FormBuilder) { }

  ngOnInit(): void {
    this.metaEntityService.findAll().subscribe(metaEntityList => {
      this.metaEntityList = metaEntityList;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['template']) {
      this.onTemplateChange(changes['template'].currentValue);
    }

    if(changes['formGroup']) {
      this.onFormGroupChange(changes['formGroup']);
    }
  }

  onTemplateChange(template: Template) {
    if(template && template.metaEntityName) {
      this.metaEntityService.findAll().subscribe(metaEntityList => {
        this.metaEntityList = metaEntityList;
        const me = metaEntityList.find(m => m.name === template.metaEntityName);
        if(me) {
          this.metaEntity = me;
          this.cells = this.formService.toCellAttributeArray(template, this.metaEntity);
        }
      });
    }
  }

  onFormGroupChange(formGroupChange: SimpleChange) {
    // if(formGroupChange.previousValue) {
    //   // TODO: remove listener
    //   console.warn(`TODO: remove listener in onFormGroupChange()`);
    // }
    //
    // if(formGroupChange.currentValue) {
    //   const formGroup = formGroupChange.currentValue as FormGroup;
    //   console.log(`TableLayoutComponent: got new formGroup to deal with: value = ${JSON.stringify(formGroup.value)}`);
    //
    //   formGroup.valueChanges.subscribe((value) => {
    //     console.log(`TableLayoutComponent: got new formGroup VALUE to worry about of ${JSON.stringify(value)}`);
    //   });
    // }
  }

  onAddRow(number: number) {
    console.log(`add row ${number}`)
    this.addBlankRow();
  }

  get attributes() {
    return this.formGroup.get(this.relationshipProperty) as FormArray;
  }

  getFormGroupForRow(rowIdx: number) {
    return this.attributes.at(rowIdx) as FormGroup;
  }

  addBlankRow() {
    this.attributes.push(this.createTableRow());
  }

  createTableRow(): FormGroup {
    return this.formService.createFormGroup(this.template, this.metaEntityList, null);
  }
}
