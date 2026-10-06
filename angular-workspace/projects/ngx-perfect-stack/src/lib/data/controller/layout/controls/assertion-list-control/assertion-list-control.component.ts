import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { MetaEntity } from '../../../../../domain/meta.entity';
import { MetaPage } from '../../../../../domain/meta.page';
import { AssertionType } from '../../../../../domain/assertion';
import { AssertionTypeService } from '../../../../data-service/assertion-type.service';

@Component({
  selector: 'lib-assertion-list-control',
  templateUrl: './assertion-list-control.component.html',
  styleUrls: ['./assertion-list-control.component.css'],
  standalone: false
})
export class AssertionListControlComponent implements OnInit {

  @Input()
  mode: string | null = 'edit';

  @Input()
  ctx: FormContext;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  metaEntityMap: Map<string, MetaEntity> = new Map();
  metaPageMap: Map<string, MetaPage> = new Map();

  constructor(
    protected readonly formGroupService: FormGroupService,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly metaPageService: MetaPageService,
    protected readonly assertionTypeService: AssertionTypeService
  ) { }

  ngOnInit(): void {
    this.metaEntityService.metaEntityMap$.subscribe(map => {
      this.metaEntityMap = map;
    });

    this.metaPageService.metaPageMap$.subscribe(map => {
      this.metaPageMap = map;
    });

    this.assertionTypeService.loadAssertionTypes().subscribe();
  }

  get relationshipProperty(): string {
    return this.cell?.attribute?.name || 'assertions';
  }

  get attributes(): UntypedFormArray | null {
    return this.formGroup && this.relationshipProperty
      ? (this.formGroup.get(this.relationshipProperty) as UntypedFormArray)
      : null;
  }

  getFormGroup(index: number): UntypedFormGroup {
    return this.attributes?.at(index) as UntypedFormGroup;
  }

  onAddAssertion(type: AssertionType): void {
    if (!this.attributes) {
      console.warn('AssertionListControl: No FormArray found for', this.relationshipProperty);
      return;
    }

    const targetEntityName = this.cell?.attribute?.relationshipTarget || 'Assertion';
    const newFg = this.formGroupService.createFormGroup(
      this.mode || 'edit',
      targetEntityName,
      this.metaPageMap,
      this.metaEntityMap,
      null
    );

    newFg.patchValue({
      assertion_type_id: type.id,
      assertion_type_name: type.assertion_type_name,
      assertion_unit: type.assertion_unit || '',
      assertion_method: type.assertion_method || '',
    });

    this.attributes.push(newFg);
  }

  onDeleteAssertion(index: number): void {
    if (this.attributes) {
      this.attributes.removeAt(index);
    }
  }
}
