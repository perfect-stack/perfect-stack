import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../domain/meta.entity';
import {Cell, Template, TemplateType} from '../../../../domain/meta.page';
import {CellAttribute} from '../../../../meta/page/meta-page-service/meta-page.service';
import {FormService} from '../../form-service/form.service';
import {MetaEntityService} from '../../../../meta/entity/meta-entity-service/meta-entity.service';

@Component({
  selector: 'app-one-to-one-control',
  templateUrl: './one-to-one-control.component.html',
  styleUrls: ['./one-to-one-control.component.css']
})
export class OneToOneControlComponent implements OnInit, OnChanges {

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  @Input()
  cell: Cell;


  childCells: CellAttribute[][];
  childFormGroup: FormGroup;

  constructor(protected readonly formService: FormService, protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    const childMetaEntityName = this.attribute.relationshipTarget;
    const childTemplate = this.cell.template;
    console.log(`OneToOneControlComponent: childMetaEntityName = ${childMetaEntityName}`);
    console.log(`OneToOneControlComponent: childTemplate = ${JSON.stringify(this.cell.template)}`);
    this.metaEntityService.findById(childMetaEntityName).subscribe(metaEntity => {
      if(childTemplate) {
        this.childCells = this.formService.toCellAttributeArray(childTemplate, metaEntity);
        this.childFormGroup = this.formGroup.controls[this.attribute.name] as FormGroup;
      }
    });
  }

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['cell']) {
      this.onCellChange(changes['cell'].currentValue);
    }
  }

  onCellChange(cell: Cell) {
    if(!cell.template) {
      const template = new Template();
      template.type = TemplateType.table;
      template.metaEntityName = this.attribute.relationshipTarget;
      cell.template = template;
    }
  }
}
