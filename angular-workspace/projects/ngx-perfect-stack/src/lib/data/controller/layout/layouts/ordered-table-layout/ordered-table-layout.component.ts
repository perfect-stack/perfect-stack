import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Observable, of, Subscription, switchMap } from 'rxjs';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MetaPage, Template } from '../../../../../domain/meta.page';
import { MetaEntity } from '../../../../../domain/meta.entity';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { FormContext, FormService } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { DebugService } from '../../../../../utils/debug/debug.service';
import { DataService } from '../../../../data-service/data.service';

@Component({
  selector: 'lib-ordered-table-layout',
  templateUrl: './ordered-table-layout.component.html',
  styleUrls: ['./ordered-table-layout.component.css'],
  standalone: false
})
export class OrderedTableLayoutComponent implements OnInit, OnChanges, OnDestroy {

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

  @Input()
  idSuffix?: string | null;

  cells$: Observable<CellAttribute[][]>;

  metaEntityMap: Map<string, MetaEntity>;
  metaPageMap: Map<string, MetaPage>;

  private metaPageSub: Subscription | null = null;

  constructor(protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService,
              protected readonly debugService: DebugService,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly formGroupService: FormGroupService,
              protected readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.updateTable();
    this.updateCells$();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateTable();
    if (changes['template'] || !this.cells$) {
      this.updateCells$();
    }
  }

  ngOnDestroy(): void {
    this.metaPageSub?.unsubscribe();
  }

  private updateTable(): void {
    this.mode = this.mode ? this.mode : this.ctx?.mode;

    if (!this.relationshipProperty && this.template?.binding) {
      this.relationshipProperty = this.template.binding;
    }

    if (!this.formGroup && this.ctx?.formMap && this.template?.binding) {
      this.formGroup = this.ctx.formMap.get(this.template.binding) as UntypedFormGroup;
      this.relationshipProperty = this.template.binding;
    }

    this.sortAttributesIfConfigured();
  }

  private getSortAttributeName(): string {
    return this.template?.orderByName || 'sort_index';
  }

  private sortAttributesIfConfigured(): void {
    const sortAttr = this.getSortAttributeName();
    if (this.attributes && this.attributes.length > 1) {
      this.attributes.controls.sort((a, b) => {
        const valA = a.get(sortAttr)?.value ?? a.get('order_index')?.value;
        const valB = b.get(sortAttr)?.value ?? b.get('order_index')?.value;
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        return Number(valA) - Number(valB);
      });
    }
  }

  private updateCells$(): void {
    if (this.template?.metaEntityName) {
      this.cells$ = this.metaEntityService.metaEntityMap$.pipe(switchMap((metaEntityMap) => {
        this.metaEntityMap = metaEntityMap;
        const metaEntity = this.metaEntityMap.get(this.template.metaEntityName);
        if (metaEntity) {
          const cells: CellAttribute[][] = this.formService.toCellAttributeArray(this.template, metaEntity);
          return of(cells);
        } else {
          throw new Error(`Unable to find metaEntity for; ${this.template.metaEntityName}`);
        }
      }));
    }
  }

  trackByRow(index: number, group: any): any {
    return group?.controls?.['id']?.value ?? index;
  }

  get attributes(): UntypedFormArray | null {
    return this.formGroup && this.relationshipProperty ? this.formGroup.get(this.relationshipProperty) as UntypedFormArray : null;
  }

  getFormGroupForRow(rowIdx: number): UntypedFormGroup | null {
    return this.attributes ? this.attributes.at(rowIdx) as UntypedFormGroup : null;
  }

  getRowIdSuffix(rowIdx: number): string {
    const prefix = this.idSuffix ? `${this.idSuffix}_` : '';
    const binding = this.template?.binding || this.relationshipProperty || 'item';
    return `${prefix}${binding}_${rowIdx}`;
  }

  onDrop(event: CdkDragDrop<any[]>): void {
    if (!this.attributes || event.previousIndex === event.currentIndex) {
      return;
    }

    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    const movedControl = this.attributes.at(previousIndex);
    this.attributes.removeAt(previousIndex);
    this.attributes.insert(currentIndex, movedControl);

    const sortAttr = this.getSortAttributeName();
    for (let i = 0; i < this.attributes.length; i++) {
      const rowGroup = this.attributes.at(i) as UntypedFormGroup;
      if (rowGroup.contains(sortAttr)) {
        rowGroup.get(sortAttr)?.setValue(i);
      }
      if (rowGroup.contains('order_index')) {
        rowGroup.get('order_index')?.setValue(i);
      }
    }

    this.attributes.updateValueAndValidity();
    if (this.formGroup) {
      this.formGroup.updateValueAndValidity();
    }

    // Atomically persist to server if entities have IDs
    const orderedIds: string[] = [];
    for (let i = 0; i < this.attributes.length; i++) {
      const rowGroup = this.attributes.at(i) as UntypedFormGroup;
      const id = rowGroup.get('id')?.value;
      if (id) {
        orderedIds.push(id);
      }
    }

    if (orderedIds.length > 0 && this.template?.metaEntityName) {
      this.dataService.reorder(this.template.metaEntityName, orderedIds).subscribe({
        next: () => {
          console.log(`Reordered ${this.template.metaEntityName} successfully`);
        },
        error: (err) => {
          console.error(`Failed to reorder ${this.template.metaEntityName}`, err);
        }
      });
    }

    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  onAddRow(): void {
    if (this.mode === 'edit') {
      const formGroup = this.formGroupService.createFormGroup(this.mode, this.template.metaEntityName, this.metaPageMap, this.metaEntityMap, null);
      if (this.attributes) {
        const sortAttr = this.getSortAttributeName();
        if (formGroup.contains(sortAttr)) {
          formGroup.get(sortAttr)?.setValue(this.attributes.length);
        }
        if (formGroup.contains('order_index')) {
          formGroup.get('order_index')?.setValue(this.attributes.length);
        }
        this.attributes.push(formGroup);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      } else {
        console.warn('Unable to find the attributes for this relationship. Is the binding name correct?');
      }
    }
  }

  onRowClicked(rowIdx: number): void {
    if (this.template.navigation === 'Enabled') {
      const route = this.template.route;
      if (route) {
        const rowData = this.getFormGroupForRow(rowIdx);
        if (rowData) {
          const id = rowData.controls['id']?.value;
          if (id) {
            let url = route.replace('${id}', id);
            if (url.includes('?')) {
              url += `&fromId=${this.ctx.id}`;
            }
            this.router.navigateByUrl(url);
          }
        }
      }
    }
  }

  onDeleteRow(i: number): void {
    if (this.attributes) {
      this.attributes.removeAt(i);
      const sortAttr = this.getSortAttributeName();
      const orderedIds: string[] = [];
      for (let idx = 0; idx < this.attributes.length; idx++) {
        const rowGroup = this.attributes.at(idx) as UntypedFormGroup;
        if (rowGroup.contains(sortAttr)) {
          rowGroup.get(sortAttr)?.setValue(idx, { emitEvent: false });
        }
        if (rowGroup.contains('order_index')) {
          rowGroup.get('order_index')?.setValue(idx, { emitEvent: false });
        }
        const id = rowGroup.get('id')?.value;
        if (id) {
          orderedIds.push(id);
        }
      }
      this.attributes.updateValueAndValidity({ emitEvent: false });

      if (orderedIds.length > 0 && this.template?.metaEntityName) {
        this.dataService.reorder(this.template.metaEntityName, orderedIds).subscribe();
      }

      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  getStyleClasses(): string {
    let styleClasses = '';
    if (this.template.navigation === 'Enabled') {
      styleClasses += ' table-hover row-navigation';
    }
    return styleClasses;
  }

  getNoItemsHtml(): string {
    return this.template.noItemsHtml ? this.template.noItemsHtml : 'No items';
  }

  hasResultsSummary(): boolean {
    return !!(this.formGroup?.get('resultsSummary') && this.formGroup.get('resultsSummary')?.value?.length > 0);
  }

  getCellWidth(nextCell: CellAttribute): string {
    return nextCell.width === '0' ? '0%' : 'auto';
  }
}
