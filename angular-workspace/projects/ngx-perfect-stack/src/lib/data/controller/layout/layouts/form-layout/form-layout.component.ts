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
  formGroup: UntypedFormGroup;

  @Input()
  metaEntity: MetaEntity;

  cells$: Observable<CellAttribute[][]>;

  constructor(public readonly debugService: DebugService,
              private metaEntityService: MetaEntityService,
              private formService: FormService) { }

  ngOnInit(): void {
    if(this.ctx && this.ctx.formMap) {
      console.log('FormLayoutComponent: initialising things the new way');
      console.log(' - formGroup:', this.formGroup);
      if(!this.template) {
        throw new Error('No template defined, cannot proceed sensibly');
      }

      this.mode = this.ctx.mode;
      if(this.formGroup) {
        console.log(' - formGroup is supplied return early');
        return;
      }

      let formLookupKey;
      let form;
      const binding = this.template.binding;
      if(binding) {
        if(binding.indexOf('.') >= 0) {
          formLookupKey = binding.substring(0, binding.indexOf('.'));
          const childFormGroup = binding.substring(binding.indexOf('.') + 1);
          console.log(`Binding NESTED for: ${binding}, formLookupKey = "${formLookupKey}", childFormGroup = "${childFormGroup}"`);
          form = this.ctx.formMap.get(formLookupKey) as UntypedFormGroup;
          form = form.controls[childFormGroup] as UntypedFormGroup;
        }
        else {
          formLookupKey = binding;
          form = this.ctx.formMap.get(formLookupKey) as UntypedFormGroup;
          console.log(`Binding ROOT - ${binding}`);
          console.log(' - form:', form);
        }

        this.formGroup = form;
      }
      else {
        console.warn(`BINDING: "${binding}" - NOT FOUND. Keep calm and carry on but you might be getting NG01052: formGroup expects a FormGroup instance from here onwards 🙂`);
      }
    }
    else {
      console.warn('UNABLE to initialise FormLayoutComponent sensibly');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['template']) {
      this.updateCells$();
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
