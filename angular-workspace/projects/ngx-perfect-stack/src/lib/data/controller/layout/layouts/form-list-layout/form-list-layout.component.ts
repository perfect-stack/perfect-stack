import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MetaPage, Template } from '../../../../../domain/meta.page';
import { MetaEntity } from '../../../../../domain/meta.entity';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { EventService } from '../../../../../event/event.service';
import { ActivityTemplateService } from '../../../../data-service/activity-template.service';

@Component({
  selector: 'lib-form-list-layout',
  templateUrl: './form-list-layout.component.html',
  styleUrls: ['./form-list-layout.component.css'],
  standalone: false,
})
export class FormListLayoutComponent implements OnInit, OnDestroy {
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

  metaEntity: MetaEntity;
  metaEntityMap: Map<string, MetaEntity>;
  metaPageMap: Map<string, MetaPage>;

  private readonly fetchingTemplateIds = new Set<string>();
  private formArraySub?: Subscription;

  constructor(
    private readonly metaEntityService: MetaEntityService,
    private readonly metaPageService: MetaPageService,
    private readonly formGroupService: FormGroupService,
    private readonly cdr: ChangeDetectorRef,
    @Optional() private readonly eventService?: EventService,
    @Optional() private readonly activityTemplateService?: ActivityTemplateService,
  ) {}

  ngOnInit(): void {
    this.mode = this.mode ? this.mode : (this.ctx ? this.ctx.mode : null);

    if (!this.formGroup && this.ctx && this.ctx.formMap && this.template && this.template.binding) {
      this.formGroup = this.ctx.formMap.get(this.template.binding) as UntypedFormGroup;
      this.relationshipProperty = this.template.binding;
    }

    if (this.ctx) {
      this.metaEntityMap = this.ctx.metaEntityMap;
      this.metaPageMap = this.ctx.metaPageMap;
    }

    if (this.template && this.template.metaEntityName) {
      if (this.metaEntityMap) {
        const me = this.metaEntityMap.get(this.template.metaEntityName);
        if (me) this.metaEntity = me;
      }

      this.metaEntityService.metaEntityMap$.subscribe((entityMap) => {
        this.metaEntityMap = entityMap;
        if (this.template && this.template.metaEntityName) {
          const me = entityMap.get(this.template.metaEntityName);
          if (me) this.metaEntity = me;
        }
      });
    }

    this.metaPageService.metaPageMap$.subscribe((pageMap) => {
      this.metaPageMap = pageMap;
    });

    this.subscribeToFormArray();
  }

  private subscribeToFormArray(): void {
    this.formArraySub?.unsubscribe();
    if (this.attributes) {
      this.formArraySub = this.attributes.valueChanges.subscribe(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      });
    }
  }

  ngOnDestroy(): void {
    this.formArraySub?.unsubscribe();
  }

  get attributes(): UntypedFormArray | null {
    if (this.formGroup && this.relationshipProperty) {
      return this.formGroup.get(this.relationshipProperty) as UntypedFormArray;
    }
    return null;
  }

  getFormGroupForRow(idx: number): UntypedFormGroup | null {
    return this.attributes ? (this.attributes.at(idx) as UntypedFormGroup) : null;
  }

  getRowIdSuffix(rowIdx: number): string {
    const prefix = this.idSuffix ? `${this.idSuffix}_` : '';
    const binding = this.relationshipProperty || this.template?.binding || 'item';
    return `${prefix}${binding}_${rowIdx}`;
  }

  getItemTitle(idx: number): string | null {
    const row = this.getFormGroupForRow(idx);
    if (!row) return null;
    const val = row.value;
    if (!val) return null;
    if (val.activity_template_name) {
      return val.activity_template_name;
    }
    if (val.activity_template && val.activity_template.activity_template_name) {
      return val.activity_template.activity_template_name;
    }
    if (val.activity_template_id && this.activityTemplateService) {
      const tmpl = this.activityTemplateService.getSynchronous(val.activity_template_id);
      if (tmpl && tmpl.activity_template_name) {
        return tmpl.activity_template_name;
      }
      if (!this.fetchingTemplateIds.has(val.activity_template_id)) {
        this.fetchingTemplateIds.add(val.activity_template_id);
        this.activityTemplateService.getActivityTemplate(val.activity_template_id).subscribe(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        });
      }
    }
    if (val.name) return val.name;
    if (val.title) return val.title;
    return null;
  }

  onAddRow(): void {
    if (this.mode === 'edit' && this.attributes && this.template && this.template.metaEntityName) {
      if (this.template.action && this.eventService && this.ctx && this.ctx.metaPage) {
        this.eventService.dispatchOnAction(
          this.ctx.metaPage.name,
          this.relationshipProperty,
          this.ctx,
          this.template.action,
          {
            formGroup: this.formGroup,
            formArray: this.attributes,
            metaEntity: this.metaEntity,
            template: this.template,
            cdr: this.cdr,
            onComplete: () => {
              this.cdr.markForCheck();
              this.cdr.detectChanges();
            },
          }
        );
        return;
      }

      const newRowForm = this.formGroupService.createFormGroup(
        this.mode,
        this.template.metaEntityName,
        this.metaPageMap,
        this.metaEntityMap,
        null,
      );
      this.attributes.push(newRowForm);
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  onDeleteRow(idx: number): void {
    if (this.mode === 'edit' && this.attributes) {
      this.attributes.removeAt(idx);
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }
}
