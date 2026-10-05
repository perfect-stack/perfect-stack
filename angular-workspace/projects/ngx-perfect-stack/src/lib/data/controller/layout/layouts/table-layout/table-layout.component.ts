import { Component, Input, OnInit } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MetaPage, Template } from '../../../../../domain/meta.page';
import { MetaEntity } from '../../../../../domain/meta.entity';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { FormContext, FormService } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { DebugService } from '../../../../../utils/debug/debug.service';

@Component({
  selector: 'lib-table-layout',
  templateUrl: './table-layout.component.html',
  styleUrls: ['./table-layout.component.css'],
  standalone: false
})
export class TableLayoutComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  ctx: FormContext;

  @Input()
  template: Template;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  relationshipProperty: string;

  cells$: Observable<CellAttribute[][]>;

  metaEntityMap: Map<string, MetaEntity>;
  metaPageMap: Map<string, MetaPage>;

  constructor(protected readonly metaEntityService: MetaEntityService,
              protected readonly debugService: DebugService,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly formGroupService: FormGroupService) { }

  ngOnInit(): void {
    this.mode = this.mode ? this.mode : this.ctx.mode;
    if(!this.formGroup && this.ctx.formMap && this.template.binding) {
      console.log(`TableLayoutComponent: template.binding = ${this.template.binding} formMap contains:`, this.ctx.formMap);
      this.formGroup = this.ctx.formMap.get(this.template.binding) as UntypedFormGroup;
      this.relationshipProperty = this.template.binding;
    }
    else {
      `TableLayoutComponent: template.binding = ${this.template.binding} did not get formGroup from formMap`
    }

    console.log(`TableLayoutComponent: template.binding = ${this.template.binding} found formGroup:`, this.formGroup);

    if(!this.template.metaEntityName) {
      throw new Error(`The template; ${JSON.stringify(this.template)} has no metaEntityName`);
    }

    this.cells$ = this.metaEntityService.metaEntityMap$.pipe(switchMap((metaEntityMap) => {
      this.metaEntityMap = metaEntityMap;
      const metaEntity = this.metaEntityMap.get(this.template.metaEntityName);
      if(metaEntity) {
        const cells: CellAttribute[][] = this.formService.toCellAttributeArray(this.template, metaEntity);
        return of(cells);
      }
      else {
        throw new Error(`Unable to find metaEntity for; ${this.template.metaEntityName}`);
      }
    }));
  }

  get attributes(): UntypedFormArray | null {
    return this.formGroup && this.relationshipProperty ? this.formGroup.get(this.relationshipProperty) as UntypedFormArray : null;
  }

  getFormGroupForRow(rowIdx: number): UntypedFormGroup | null {
    return this.attributes ? this.attributes.at(rowIdx) as UntypedFormGroup : null;
  }

  onAddRow() {
    if(this.mode === 'edit') {
      const formGroup = this.formGroupService.createFormGroup(this.mode, this.template.metaEntityName, this.metaPageMap, this.metaEntityMap, null);
      if(this.attributes) {
        console.log('onAddRow()');
        this.attributes.push(formGroup);
      }
      else {
        console.warn('Unable to find the attributes for this relationship. Is the binding name correct? For example media_files instead of mediaFiles');
      }
    }
  }

  onRowClicked(rowIdx: number) {
    console.log(`row clicked: ${rowIdx}`);
    if(this.template.navigation === 'Enabled') {
      const route = this.template.route;
      if(route) {
        const rowData = this.getFormGroupForRow(rowIdx);

        if(rowData) {
          console.log('got rowData: ', rowData);
          const idControl = rowData.controls['id'];
          console.log('got idControl: ', idControl);
          const id = idControl.value;
          console.log('got id value: ', id);
          if(id) {
            let url = route.replace('${id}', id);
            if(url.includes('?')) {
              url += `&fromId=${this.ctx.id}`;
            }
            console.log(`Navigating to route: ${url}`);
            this.router.navigateByUrl(url);
          }
          else {
            console.warn(`Unable to find id for row ${rowIdx} in rowData ${JSON.stringify(this.formGroup.value)}`);
          }
        }
        else {
          console.warn(`Unable to find row data for row ${rowIdx}`);
        }
      }
      else {
        console.warn(`Template navigation is enabled but no route has been supplied`, this.template);
      }
    }
  }

  onDeleteRow(i: number) {
    console.log(`delete row: ${i}`);
    if(this.attributes) {
      this.attributes.removeAt(i);
    }
  }

  getStyleClasses() {
    let styleClasses = '';
    if(this.template.navigation === 'Enabled') {
      styleClasses += ' table-hover row-navigation';
    }
    return styleClasses;
  }

  getNoItemsHtml() {
    return this.template.noItemsHtml ? this.template.noItemsHtml : 'No items';
  }

  hasResultsSummary() {
    return this.formGroup.get('resultsSummary') !== null && this.formGroup.get('resultsSummary')?.value.length > 0;
  }

  getCellWidth(nextCell: CellAttribute) {
    return nextCell.width === '0' ? '0%' : 'auto';
  }
}
