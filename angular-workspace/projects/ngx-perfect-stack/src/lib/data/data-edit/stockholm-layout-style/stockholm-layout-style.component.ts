import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
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
export class StockholmLayoutStyleComponent implements OnInit, OnDestroy {
  @Input()
  ctx: FormContext;

  eventHighlighted = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly cdr: ChangeDetectorRef,
    @Optional() public readonly mapCoordinator?: MapEditCoordinatorService,
  ) {}

  ngOnInit(): void {
    if (this.mapCoordinator) {
      this.mapCoordinator.focusEvent$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        const eventSection = this.elementRef.nativeElement.querySelector(
          '[data-map-event-section="true"]',
        ) as HTMLElement | null;
        if (eventSection) {
          this.mapCoordinator!.scrollElementIntoViewBelowMap(eventSection);
          this.eventHighlighted = true;
          this.cdr.markForCheck();
          setTimeout(() => {
            this.eventHighlighted = false;
            this.cdr.markForCheck();
          }, 1800);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  isEventLocationTemplate(template: Template): boolean {
    if (!template || this.isMapTemplate(template) || template.type !== TemplateType.form) {
      return false;
    }
    if (template.metaEntityName === 'Location') {
      return true;
    }
    return (
      template.cells?.some((row) =>
        row?.some(
          (cell) =>
            cell?.attributeName === 'geometry' || cell?.attribute?.name === 'geometry',
        ),
      ) ?? false
    );
  }

  isStickyMapTemplate(template: Template): boolean {
    return (
      this.isMapTemplate(template) &&
      (this.currentMapSizeMode === 'small' || this.currentMapSizeMode === 'medium')
    );
  }
}
