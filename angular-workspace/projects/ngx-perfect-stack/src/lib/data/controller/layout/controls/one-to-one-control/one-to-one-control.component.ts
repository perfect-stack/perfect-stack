import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { Template, TemplateType } from '../../../../../domain/meta.page';
import { FormContext, FormService } from '../../../../data-edit/form-service/form.service';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';

@Component({
  selector: 'lib-one-to-one-control',
  templateUrl: './one-to-one-control.component.html',
  styleUrls: ['./one-to-one-control.component.css'],
  standalone: false
})
export class OneToOneControlComponent implements OnInit, OnChanges {

  @Input()
  mode: string | null;

  @Input()
  ctx: FormContext;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  childCells: CellAttribute[][];
  childFormGroup: UntypedFormGroup;

  constructor(
    protected readonly formService: FormService,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.updateChildForm();
  }

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['cell']) {
      this.onCellChange(changes['cell'].currentValue);
    }
    this.updateChildForm();
  }

  private updateChildForm(): void {
    if(this.cell && this.cell.attribute) {
      const attribute = this.cell.attribute;
      const childMetaEntityName = attribute.relationshipTarget;
      const childTemplate = this.cell.template;
      this.metaEntityService.metaEntityMap$.subscribe((metaEntityMap) => {
        const metaEntity = metaEntityMap.get(childMetaEntityName);
        if(childTemplate && metaEntity) {
          this.childCells = this.formService.toCellAttributeArray(childTemplate, metaEntity);
          this.childFormGroup = this.formGroup?.controls?.[attribute.name] as UntypedFormGroup;
          this.cdr.markForCheck();
        }
      });
    }
  }

  onCellChange(cell: CellAttribute) {
    if(!cell.template) {
      if(cell && cell.attribute) {
        const attribute = cell.attribute;
        const template = new Template();
        template.type = TemplateType.table;
        template.metaEntityName = attribute.relationshipTarget;
        cell.template = template;
      }
    }
  }
}
