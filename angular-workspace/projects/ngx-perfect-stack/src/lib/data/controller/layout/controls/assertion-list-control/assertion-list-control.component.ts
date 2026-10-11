import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { AbstractControl, FormGroup, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { MetaEntity } from '../../../../../domain/meta.entity';
import { MetaPage } from '../../../../../domain/meta.page';
import { AssertionType } from '../../../../../domain/assertion';
import { AssertionTypeService } from '../../../../data-service/assertion-type.service';
import { ActivityTemplateService } from '../../../../data-service/activity-template.service';

@Component({
  selector: 'lib-assertion-list-control',
  templateUrl: './assertion-list-control.component.html',
  styleUrls: ['./assertion-list-control.component.css'],
  standalone: false
})
export class AssertionListControlComponent implements OnInit, OnDestroy, OnChanges {

  @Input()
  mode: string | null = 'edit';

  @Input()
  ctx: FormContext;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  layoutStyle?: string;

  @Input()
  activityTemplate?: any;

  private templateSub?: Subscription;

  metaEntityMap: Map<string, MetaEntity> = new Map();
  metaPageMap: Map<string, MetaPage> = new Map();

  constructor(
    protected readonly formGroupService: FormGroupService,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly metaPageService: MetaPageService,
    protected readonly assertionTypeService: AssertionTypeService,
    protected readonly activityTemplateService: ActivityTemplateService,
    protected readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.metaEntityService.metaEntityMap$.subscribe(map => {
      this.metaEntityMap = map;
    });

    this.metaPageService.metaPageMap$.subscribe(map => {
      this.metaPageMap = map;
    });

    this.assertionTypeService.loadAssertionTypes().subscribe();

    if (!this.activityTemplate) {
      this.initActivityTemplateListener();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activityTemplate'] && !changes['activityTemplate'].isFirstChange()) {
      this.cdr.markForCheck();
    }
    if (changes['formGroup'] && !changes['formGroup'].isFirstChange() && !this.activityTemplate) {
      this.templateSub?.unsubscribe();
      this.initActivityTemplateListener();
    }
  }

  private initActivityTemplateListener(): void {
    const templateIdCtrl = this.findTemplateIdControl(this.formGroup);
    if (templateIdCtrl) {
      this.loadTemplate(templateIdCtrl.value);

      this.templateSub = templateIdCtrl.valueChanges
        .pipe(distinctUntilChanged())
        .subscribe(templateId => {
          this.loadTemplate(templateId);
        });
    }
  }

  private findTemplateIdControl(group: AbstractControl | null): AbstractControl | null {
    let current: AbstractControl | null = group;
    while (current) {
      if (current instanceof FormGroup || current instanceof UntypedFormGroup) {
        const ctrl = current.get('activity_template_id');
        if (ctrl) {
          return ctrl;
        }
      }
      current = current.parent;
    }
    return null;
  }

  private loadTemplate(templateId: string): void {
    if (!templateId) {
      this.activityTemplate = null;
      this.cdr.markForCheck();
      return;
    }

    this.activityTemplateService.getActivityTemplate(templateId).subscribe(template => {
      this.activityTemplate = template;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.templateSub?.unsubscribe();
  }

  get resolvedLayoutStyle(): string | undefined {
    if (this.layoutStyle) {
      return this.layoutStyle;
    }
    if (this.cell?.options) {
      return this.cell.options;
    }
    if (this.activityTemplate?.layout_style) {
      return this.activityTemplate.layout_style;
    }
    return this.findLayoutStyleInGroup(this.formGroup);
  }

  private findLayoutStyleInGroup(group: AbstractControl | null): string | undefined {
    let current: AbstractControl | null = group;
    while (current) {
      if (current instanceof FormGroup || current instanceof UntypedFormGroup) {
        const ctrl = current.get('layout_style');
        if (ctrl) {
          return ctrl.value || 'Card';
        }
      }
      current = current.parent;
    }
    return undefined;
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
