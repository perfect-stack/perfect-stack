import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { UntypedFormGroup } from '@angular/forms';
import { Cell, LabelLayoutType, Template } from '../../../../../domain/meta.page';
import { AttributeType, MetaEntity } from '../../../../../domain/meta.entity';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { FormContext, FormService } from '../../../../data-edit/form-service/form.service';
import { DebugService } from '../../../../../utils/debug/debug.service';

@Component({
  selector: 'lib-form-layout',
  templateUrl: './form-layout.component.html',
  styleUrls: ['./form-layout.component.css'],
  standalone: false
})
export class FormLayoutComponent implements OnInit, OnChanges {

  @Input()
  mode: string | null;

  @Input()
  ctx: FormContext;

  @Input()
  template: Template;

  @Input()
  set formGroup(value: UntypedFormGroup) {
    this._formGroup = value;
  }
  get formGroup(): UntypedFormGroup {
    if (this._formGroup && typeof this._formGroup.get === 'function') {
      return this._formGroup;
    }
    return this._resolvedFormGroup;
  }
  private _formGroup: UntypedFormGroup;
  private _resolvedFormGroup: UntypedFormGroup;

  @Input()
  metaEntity: MetaEntity;

  cells$: Observable<CellAttribute[][]>;

  get hasFormGroup(): boolean {
    const fg = this.formGroup;
    return !!(fg && typeof fg.get === 'function');
  }

  constructor(public readonly debugService: DebugService,
              private metaEntityService: MetaEntityService,
              private formService: FormService) { }

  ngOnInit(): void {
    this.updateResolvedFormGroup();
    this.updateCells$();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formGroup']) {
      if (this._formGroup && typeof this._formGroup.get !== 'function') {
        this._formGroup = undefined as any;
      }
    }
    this.updateResolvedFormGroup();
    if (changes['template'] || !this.cells$) {
      this.updateCells$();
    }
  }

  updateResolvedFormGroup(): void {
    if (this.ctx && this.ctx.formMap) {
      this.mode = this.mode ? this.mode : this.ctx.mode;

      let formLookupKey;
      let form;
      const binding = this.template?.binding;
      if (binding) {
        if (binding.indexOf('.') >= 0) {
          formLookupKey = binding.substring(0, binding.indexOf('.'));
          const childFormGroup = binding.substring(binding.indexOf('.') + 1);
          form = this.ctx.formMap.get(formLookupKey) as UntypedFormGroup;
          if (form && form.controls) {
            form = form.controls[childFormGroup] as UntypedFormGroup;
          }
        } else {
          formLookupKey = binding;
          form = this.ctx.formMap.get(formLookupKey) as UntypedFormGroup;
        }

        if (form && typeof form.get === 'function') {
          this._resolvedFormGroup = form;
        } else {
          this._resolvedFormGroup = undefined as any;
        }
      } else {
        this._resolvedFormGroup = undefined as any;
      }
    }
  }

  updateCells$() {
    if(this.template) {
      this.cells$ = this.metaEntityService.metaEntityMap$.pipe(switchMap((metaEntityMap) => {
        const metaEntity = metaEntityMap.get(this.template.metaEntityName);
        if(metaEntity) {
          const cells: CellAttribute[][] = this.formService.toCellAttributeArray(this.template, metaEntity);
          return of(cells);
        }
        else {
          throw new Error(`Unable to find metaEntity for: ${this.template.metaEntityName}`);
        }
      }));
    }
  }

  getCSS(cell: Cell): string[] {
    return [
      `col-${cell.width}`
    ];
  }

  isShowLabel(cell: CellAttribute) {
    const hiddenAttributeTypes = new Set<AttributeType>([AttributeType.OneToPoly, AttributeType.Boolean]);
    const hideAttributeType = cell && cell.attribute && hiddenAttributeTypes.has(cell.attribute.type);
    const hideLabel = cell.hideLabel || cell.labelLayout === LabelLayoutType.Hidden;
    return !(hideAttributeType || hideLabel);
  }

  isShowLabelTop(cell: CellAttribute): boolean {
    return cell.labelLayout === undefined || cell.labelLayout === LabelLayoutType.Top;
  }

  isShowLabelLeft(cell: CellAttribute): boolean {
    return cell.labelLayout === LabelLayoutType.Left;
  }

  get AttributeType() {
    return AttributeType;
  }

  isFormRow(row: CellAttribute[]) {
    return !(row && row.length === 1 && row[0].tool && row[0].tool.type === 'Map');
  }
}
