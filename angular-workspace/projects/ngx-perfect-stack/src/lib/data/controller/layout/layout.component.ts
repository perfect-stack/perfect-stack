/**
 * @packageDocumentation
 * # Layout Subsystem
 *
 * The dynamic metadata-driven layout rendering engine of `ngx-perfect-stack`.
 *
 * Interprets declarative `MetaPage`, `Template`, `Row`, and `Cell` definitions to render
 * responsive layouts (`HeaderLayout`, `FormLayout`, `TableLayout`, `CardLayout`, `FormListLayout`),
 * relational controls (`OneToManyControl`, `OneToOneControl`, `OneToPolyControl`),
 * and interactive page tools (`TabTool`, `ButtonTabsTool`, `DurationTool`).
 *
 * All recursive layout rendering is decoupled via {@link LayoutOutletComponent} and
 * {@link LAYOUT_COMPONENT} to guarantee a Directed Acyclic Graph (DAG) and prevent
 * Angular compiler import cycles (`NG3003`).
 *
 * See `README.md` in this directory for architectural diagrams and design rules.
 */

import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Template, TemplateLocationType } from '../../../domain/meta.page';
import { MetaEntity } from '../../../domain/meta.entity';
import { FormContext } from '../../data-edit/form-service/form.service';
import { DebugService } from '../../../utils/debug/debug.service';

export * from './layout-outlet/layout.token';
export * from './layout-outlet/layout-outlet.component';
export * from './layouts/table-layout/table-layout.component';
export * from './layouts/card-layout/card-layout.component';
export * from './layouts/form-layout/form-layout.component';
export * from './layouts/header-layout/header-layout.component';
export * from './layouts/form-list-layout/form-list-layout.component';
export * from './cell/cell.component';
export * from './controls/one-to-many-control/one-to-many-control.component';
export * from './controls/one-to-poly-control/one-to-poly-control.component';
export * from './controls/one-to-one-control/one-to-one-control.component';
export * from './controls/assertion-selector/assertion-selector.component';
export * from './controls/assertion-control/assertion-control.component';
export * from './controls/assertion-list-control/assertion-list-control.component';
export * from './controls/spy-control/spy-control.component';
export * from './tool-view/tool-view.component';
export * from './tool-view/button-tabs-tool/button-tabs-tool.component';
export * from './tool-view/duration-tool/duration-tool.component';
export * from './tool-view/tab-tool/tab-tool.component';

/**
 * Root dispatcher component for the Layout Subsystem.
 *
 * Evaluates the `template.type` on the input {@link Template} and dispatches to the
 * appropriate structural layout (`HeaderLayout`, `FormLayout`, `TableLayout`, `CardLayout`, `FormListLayout`).
 */
@Component({
  selector: 'lib-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  standalone: false
})
export class LayoutComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  template: Template;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  relationshipProperty: string;

  @Input()
  metaEntity: MetaEntity;

  @Input()
  ctx: FormContext | null;

  @Input()
  showTemplateHeadings = true;

  hasBottomLocations = false;

  constructor(public readonly debugService: DebugService) { }

  ngOnInit(): void {
    if(this.template && this.template.locations) {
      this.hasBottomLocations =
        this.template.locations[TemplateLocationType.BottomLeft] !== undefined
        || this.template.locations[TemplateLocationType.BottomMiddle] !== undefined
        || this.template.locations[TemplateLocationType.BottomRight] !== undefined;
    }

    if(this.ctx) {
      this.mode = this.ctx.mode;
      this.metaEntity = this.ctx.metaEntityMap.get(this.template.metaEntityName) as MetaEntity;
      if(!this.formGroup && this.ctx.formMap && this.template.binding) {
        this.formGroup = this.ctx.formMap.get(this.template.binding) as UntypedFormGroup;
        this.relationshipProperty = this.template.binding;
      }
    }
  }

  getFormGroupForTemplate(template: Template): UntypedFormGroup {
    if(this.ctx && this.ctx.formMap && template.binding) {
      return this.ctx.formMap.get(template.binding) as unknown as UntypedFormGroup;
    }
    else if(template.binding) {
      const fg = this.formGroup.get(template.binding);
      if(fg) {
        return fg as UntypedFormGroup;
      }
      else {
        throw new Error(`Unable to find formGroup for binding ${template.binding} in controls ${Object.keys(this.formGroup.controls)}`);
      }
    }
    else {
      return this.formGroup;
    }
  }

  getMetaEntity(template: Template): MetaEntity {
    if(this.ctx && this.ctx.formMap && template.metaEntityName) {
      return this.ctx.metaEntityMap.get(template.metaEntityName) as MetaEntity;
    }
    else {
      return this.metaEntity;
    }
  }

  get TemplateLocationType() {
    return TemplateLocationType;
  }
}
