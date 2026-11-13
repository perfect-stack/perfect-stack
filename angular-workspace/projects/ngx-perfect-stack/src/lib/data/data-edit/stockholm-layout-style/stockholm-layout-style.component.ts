import { Component, Input, OnInit, Optional } from '@angular/core';
import { FormContext } from '../form-service/form.service';
import { Template, TemplateType, ToolType } from '../../../domain/meta.page';
import {
  MapEditCoordinatorService,
  MapSizeMode,
} from '../../controller/layout/tool-view/map-tool/map-edit-coordinator.service';

@Component({
  selector: 'lib-stockholm-layout-style',
  templateUrl: './stockholm-layout-style.component.html',
  styleUrls: ['./stockholm-layout-style.component.css'],
  standalone: false,
})
export class StockholmLayoutStyleComponent implements OnInit {
  @Input()
  ctx: FormContext;

  constructor(@Optional() public readonly mapCoordinator?: MapEditCoordinatorService) {}

  ngOnInit(): void {}

  get headerTemplates() {
    return this.ctx.metaPage.templates.filter((s) => s.type === TemplateType.header);
  }

  get contentTemplates() {
    return this.ctx.metaPage.templates.filter((s) => s.type !== TemplateType.header);
  }

  get currentMapSizeMode(): MapSizeMode {
    return this.mapCoordinator?.mapSizeMode() || 'small';
  }

  get hasMapTemplate(): boolean {
    return this.contentTemplates.some((t) => this.isMapTemplate(t));
  }

  get isSplitViewActive(): boolean {
    return (
      this.currentMapSizeMode === 'split' &&
      this.hasMapTemplate &&
      (typeof window === 'undefined' || window.innerWidth >= 1200)
    );
  }

  get splitGridRowSpan(): number {
    return Math.max(1, this.contentTemplates.filter((t) => !this.isMapTemplate(t)).length + 1);
  }

  isMapTemplate(template: Template): boolean {
    return (
      template?.cells?.some((row) => row?.some((cell) => cell?.tool?.type === ToolType.Map)) ??
      false
    );
  }

  isStickyMapTemplate(template: Template): boolean {
    return (
      this.isMapTemplate(template) &&
      (this.currentMapSizeMode === 'small' || this.currentMapSizeMode === 'medium')
    );
  }
}
