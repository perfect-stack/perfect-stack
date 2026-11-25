import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, Optional, SimpleChanges } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { MetaPage, Template } from '../../../../../domain/meta.page';
import { MetaEntity } from '../../../../../domain/meta.entity';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { EventService } from '../../../../../event/event.service';
import { ActivityTemplateService } from '../../../../data-service/activity-template.service';
import { MapEditCoordinatorService } from '../../tool-view/map-tool/map-edit-coordinator.service';

@Component({
  selector: 'lib-form-list-layout',
  templateUrl: './form-list-layout.component.html',
  styleUrls: ['./form-list-layout.component.css'],
  standalone: false,
})
export class FormListLayoutComponent implements OnInit, OnChanges, OnDestroy {
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
  highlightedIndex: number | null = null;
  currentPage = 1;

  private readonly fetchingTemplateIds = new Set<string>();
  private readonly rowTrackIds = new WeakMap<AbstractControl, number>();
  private nextTrackId = 1;
  private formArraySub?: Subscription;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly metaEntityService: MetaEntityService,
    private readonly metaPageService: MetaPageService,
    private readonly formGroupService: FormGroupService,
    private readonly cdr: ChangeDetectorRef,
    private readonly elementRef: ElementRef<HTMLElement>,
    @Optional() private readonly eventService?: EventService,
    @Optional() private readonly activityTemplateService?: ActivityTemplateService,
    @Optional() private readonly mapCoordinator?: MapEditCoordinatorService,
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

      this.metaEntityService.metaEntityMap$.pipe(takeUntil(this.destroy$)).subscribe((entityMap) => {
        this.metaEntityMap = entityMap;
        if (this.template && this.template.metaEntityName) {
          const me = entityMap.get(this.template.metaEntityName);
          if (me) this.metaEntity = me;
        }
      });
    }

    this.metaPageService.metaPageMap$.pipe(takeUntil(this.destroy$)).subscribe((pageMap) => {
      this.metaPageMap = pageMap;
    });

    if (this.isOccurrencesList() && this.mapCoordinator) {
      this.mapCoordinator.focusCard$.pipe(takeUntil(this.destroy$)).subscribe((idx) => {
        if (this.goToPageForIndex(idx)) {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
        const cardEl = this.elementRef.nativeElement.querySelector(`#occurrence-card-${idx}`) as HTMLElement | null;
        if (cardEl) {
          this.mapCoordinator!.scrollElementIntoViewBelowMap(cardEl);
          this.highlightedIndex = idx;
          this.cdr.markForCheck();
          setTimeout(() => {
            if (this.highlightedIndex === idx) {
              this.highlightedIndex = null;
              this.cdr.markForCheck();
            }
          }, 1800);
        }
      });
    }

    this.subscribeToFormArray();
    this.clampCurrentPage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const formGroupChanged = changes['formGroup'] && !changes['formGroup'].firstChange;
    const relPropChanged = changes['relationshipProperty'] && !changes['relationshipProperty'].firstChange;

    if (formGroupChanged || relPropChanged) {
      this.currentPage = 1;
      this.subscribeToFormArray();
    }

    if (changes['template'] && !changes['template'].firstChange) {
      this.clampCurrentPage();
    }
  }

  private subscribeToFormArray(): void {
    this.formArraySub?.unsubscribe();
    if (this.attributes) {
      this.formArraySub = this.attributes.valueChanges.subscribe(() => {
        this.clampCurrentPage();
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      });
    }
  }

  ngOnDestroy(): void {
    this.formArraySub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get effectivePageSize(): number | null {
    const raw = Number(this.template?.pageSize);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
  }

  get totalCount(): number {
    return this.attributes ? this.attributes.length : 0;
  }

  get isPaginated(): boolean {
    return this.effectivePageSize !== null;
  }

  get totalPages(): number {
    const pageSize = this.effectivePageSize;
    if (!pageSize || this.totalCount <= 0) {
      return 1;
    }
    return Math.ceil(this.totalCount / pageSize);
  }

  get showPagination(): boolean {
    const pageSize = this.effectivePageSize;
    return pageSize !== null && this.totalCount > pageSize;
  }

  get clampedPage(): number {
    const maxPage = this.totalPages;
    if (this.currentPage < 1) {
      return 1;
    }
    if (this.currentPage > maxPage) {
      return maxPage;
    }
    return this.currentPage;
  }

  get pageStartIndex(): number {
    const pageSize = this.effectivePageSize;
    if (!pageSize || this.totalCount === 0) {
      return 0;
    }
    return (this.clampedPage - 1) * pageSize;
  }

  get pageEndIndex(): number {
    const pageSize = this.effectivePageSize;
    if (!pageSize) {
      return this.totalCount;
    }
    return Math.min(this.pageStartIndex + pageSize, this.totalCount);
  }

  get visibleControls(): AbstractControl[] {
    const attrs = this.attributes;
    if (!attrs) {
      return [];
    }
    const pageSize = this.effectivePageSize;
    if (!pageSize) {
      return attrs.controls;
    }
    return attrs.controls.slice(this.pageStartIndex, this.pageEndIndex);
  }

  getRowTrackId(row: AbstractControl): number {
    let id = this.rowTrackIds.get(row);
    if (id === undefined) {
      id = this.nextTrackId++;
      this.rowTrackIds.set(row, id);
    }
    return id;
  }

  onPageChange(page: number, scrollToTop = false): void {
    this.currentPage = page;
    this.clampCurrentPage();
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    if (scrollToTop) {
      const container = this.elementRef.nativeElement.querySelector('.form-list-container') as HTMLElement | null;
      if (container) {
        if (this.mapCoordinator) {
          this.mapCoordinator.scrollElementIntoViewBelowMap(container);
        } else if (typeof container.scrollIntoView === 'function') {
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }

  private clampCurrentPage(): void {
    const clamped = this.clampedPage;
    if (this.currentPage !== clamped) {
      this.currentPage = clamped;
    }
  }

  private goToPageForIndex(idx: number): boolean {
    const pageSize = this.effectivePageSize;
    if (!pageSize || idx < 0 || idx >= this.totalCount) {
      return false;
    }
    const targetPage = Math.floor(idx / pageSize) + 1;
    if (this.currentPage !== targetPage) {
      this.currentPage = targetPage;
      return true;
    }
    return false;
  }

  isOccurrencesList(): boolean {
    const binding = this.relationshipProperty || this.template?.binding;
    return binding === 'occurrences' || this.template?.metaEntityName === 'Occurrence';
  }

  getCardElementId(rowIdx: number): string {
    if (this.isOccurrencesList()) {
      return `occurrence-card-${rowIdx}`;
    }
    const binding = this.relationshipProperty || this.template?.binding || 'item';
    return `${binding}-card-${rowIdx}`;
  }

  isCardActiveOnMap(rowIdx: number): boolean {
    if (!this.isOccurrencesList() || !this.mapCoordinator) {
      return false;
    }
    const active = this.mapCoordinator.activeTarget();
    return active?.kind === 'occurrence' && active.index === rowIdx && this.mapCoordinator.editPhase() !== 'idle';
  }

  isCardHoveredOnMap(rowIdx: number): boolean {
    if (!this.isOccurrencesList() || !this.mapCoordinator) {
      return false;
    }
    const hovered = this.mapCoordinator.hoveredTarget();
    return (hovered?.kind === 'occurrence' && hovered.index === rowIdx) || this.highlightedIndex === rowIdx;
  }

  onCardMouseEnter(rowIdx: number): void {
    if (this.isOccurrencesList()) {
      this.mapCoordinator?.setHoveredTarget({ kind: 'occurrence', index: rowIdx });
    }
  }

  onCardMouseLeave(rowIdx: number): void {
    if (this.isOccurrencesList()) {
      const curr = this.mapCoordinator?.hoveredTarget();
      if (curr?.kind === 'occurrence' && curr.index === rowIdx) {
        this.mapCoordinator?.setHoveredTarget(null);
      }
    }
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
              if (this.effectivePageSize) {
                this.currentPage = this.totalPages;
              }
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
      if (this.effectivePageSize) {
        this.currentPage = this.totalPages;
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  onDeleteRow(idx: number): void {
    if (this.mode === 'edit' && this.attributes) {
      this.attributes.removeAt(idx);
      this.clampCurrentPage();
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }
}
