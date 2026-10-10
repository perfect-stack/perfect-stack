import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { MetaPage, Template } from '../../../../../domain/meta.page';
import { MetaEntity } from '../../../../../domain/meta.entity';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';

@Component({
  selector: 'lib-form-list-layout',
  templateUrl: './form-list-layout.component.html',
  styleUrls: ['./form-list-layout.component.css'],
  standalone: false,
})
export class FormListLayoutComponent implements OnInit {
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

  metaEntity: MetaEntity;
  metaEntityMap: Map<string, MetaEntity>;
  metaPageMap: Map<string, MetaPage>;

  constructor(
    private readonly metaEntityService: MetaEntityService,
    private readonly metaPageService: MetaPageService,
    private readonly formGroupService: FormGroupService,
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

  onAddRow(): void {
    if (this.mode === 'edit' && this.attributes && this.template && this.template.metaEntityName) {
      const newRowForm = this.formGroupService.createFormGroup(
        this.mode,
        this.template.metaEntityName,
        this.metaPageMap,
        this.metaEntityMap,
        null,
      );
      this.attributes.push(newRowForm);
    }
  }

  onDeleteRow(idx: number): void {
    if (this.mode === 'edit' && this.attributes) {
      this.attributes.removeAt(idx);
    }
  }
}
