import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Observable, of, switchMap } from 'rxjs';
import { Cell, Template } from '../../../domain/meta.page';
import { AttributeType, MetaEntity } from '../../../domain/meta.entity';
import { CellAttribute } from '../../../meta/page/meta-page-service/meta-page.service';
import { MetaEntityService } from '../../../meta/entity/meta-entity-service/meta-entity.service';
import { FormContext, FormService } from '../../data-edit/form-service/form.service';
import { DebugService } from '../../../utils/debug/debug.service';

@Component({
  selector: 'lib-header-layout',
  templateUrl: './header-layout.component.html',
  styleUrls: ['./header-layout.component.css'],
  standalone: false
})
export class HeaderLayoutComponent implements OnInit, OnChanges {

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
      this.mode = this.ctx.mode;

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
          console.log(`Binding ROOT - ${binding}`)
          form = this.ctx.formMap.get(formLookupKey) as UntypedFormGroup;
        }

        this.formGroup = form;
      }
      else {
        console.log('Binding - Not found. Keep calm and carry on 🙂');
      }
    }
    else {
      console.warn('UNABLE to initialise FormLayoutComponent sensibly');
    }

    //this.updateCells$();
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
    const hideLabelsSet = new Set<AttributeType>([AttributeType.OneToPoly, AttributeType.Boolean]);
    return cell && cell.attribute ? !hideLabelsSet.has(cell.attribute.type) : true;
  }

  get AttributeType() {
    return AttributeType;
  }

  isFormRow(row: CellAttribute[]) {
    // Was in a hurry and needed to suppress the form-row class on rows that used the Map component. Ideally the Row
    // object of the MetaPage would have metadata to control this, but have gone with a hunt-and-shoot-to-kill approach
    // for now. If the row has one cell and that Cell is a ToolView, and it has a Map component then "form-row" is
    // disabled.
    return !(row && row.length === 1 && row[0].tool && row[0].tool.type === 'Map');
  }
}
