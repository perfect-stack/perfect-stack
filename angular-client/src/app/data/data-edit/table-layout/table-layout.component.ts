import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Template} from '../../../domain/meta.page';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {AttributeType, MetaEntity, VisibilityType} from '../../../domain/meta.entity';
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
  cells: CellAttribute[][];

  constructor(protected readonly metaEntityService: MetaEntityService,
              protected readonly formService: FormService,
              private fb: FormBuilder) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['template']) {
      this.onTemplateChange(changes['template'].currentValue);
    }
  }

  onTemplateChange(template: Template) {
    if(template && template.metaEntityName) {
      this.metaEntityService.findById(template.metaEntityName).subscribe(metaEntity => {
        this.metaEntity = metaEntity
        this.cells = this.formService.toCellAttributeArray(template, metaEntity);
      });
    }
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
/*    return this.fb.group({
      name: ['', Validators.required],
      label: ['', Validators.required],
      description: [''],
      type: [AttributeType.Text],
      visibility: [VisibilityType.Visible],
      comparisonOperator: [''],
      relationshipTarget: [''],
    });*/
    return this.formService.createForm(this.template, this.metaEntity);
  }
}
