import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {FormContext, FormService} from '../../../../data-edit/form-service/form.service';
import {Template, TreeNodeTypeConfig, TreeTool} from '../../../../../domain/meta.page';
import {DataService} from '../../../../data-service/data.service';
import {MetaEntityService} from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import {AttributeType, MetaEntity} from '../../../../../domain/meta.entity';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {Router} from '@angular/router';
import {ToastService} from '../../../../../utils/toasts/toast.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MessageDialogComponent} from '../../../../../utils/message-dialog/message-dialog.component';
import {AbstractControl, UntypedFormArray, UntypedFormGroup} from '@angular/forms';
import {from, of, Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {SaveResponse} from '../../../../data-service/save.response';
import {ValidationResultMapController} from '../../../../../domain/meta.rule';
import {
  DoubleVisitor,
  GeometryVisitor,
  IdentifierVisitor,
  IntegerVisitor,
  MetaEntityTreeWalker
} from '../../../../../utils/tree-walker/meta-entity-tree-walker';

@Component({
  selector: 'lib-tree-tool',
  templateUrl: './tree-tool.component.html',
  styleUrls: ['./tree-tool.component.scss'],
  standalone: false
})
export class TreeToolComponent implements OnInit {

  @Input()
  treeTool: TreeTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  rootNodes: any[] = [];
  metaEntity: MetaEntity | null = null;
  loading = false;
  error: string | null = null;

  expandedSet = new Set<string>();
  loadingNodes = new Set<string>();

  selectedNode: any | null = null;
  detailCtx: FormContext | null = null;
  detailMode: 'view' | 'edit' = 'view';
  loadingDetail = false;
  savingDetail = false;
  errorDetail: string | null = null;
  originalDetailValueJson: string | null = null;

  constructor(
    protected readonly dataService: DataService,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly propertySheetService: PropertySheetService,
    protected readonly formService: FormService,
    protected readonly toastService: ToastService,
    protected readonly modalService: NgbModal,
    protected readonly router: Router,
    protected readonly cdr: ChangeDetectorRef
  ) { }

  get rootNode(): any | null {
    return this.rootNodes.length > 0 ? this.rootNodes[0] : null;
  }

  set rootNode(value: any | null) {
    this.rootNodes = value ? (Array.isArray(value) ? value : [value]) : [];
  }

  ngOnInit(): void {
    if (this.editorMode) {
      return;
    }

    const entityName = this.metaEntityName;
    if (!entityName) {
      this.error = 'No metaEntityName configured for TreeTool';
      return;
    }

    this.loading = true;
    this.metaEntityService.metaEntityMap$.subscribe((metaEntityMap) => {
      this.metaEntity = metaEntityMap.get(entityName) ?? null;
      this.cdr.markForCheck();
    });

    const depth = this.treeTool?.initialDepth ?? 3;
    const treeType = this.treeTool?.treeType;
    this.dataService.findRootTree(entityName, depth, treeType).subscribe({
      next: (treeResult) => {
        if (Array.isArray(treeResult)) {
          this.rootNodes = treeResult;
        } else if (treeResult) {
          this.rootNodes = [treeResult];
        } else {
          this.rootNodes = [];
        }
        this.loading = false;
        const expandDepth = this.treeTool?.initialExpandDepth ?? 1;
        for (const root of this.rootNodes) {
          this.autoExpandInitialLevels(root, expandDepth);
        }
        if (this.treeTool?.masterDetail && this.rootNodes.length > 0) {
          this.selectNode(this.rootNodes[0]);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load tree data:', err);
        this.error = 'Failed to load tree data';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get metaEntityName(): string | undefined {
    return this.treeTool?.metaEntityName || this.ctx?.metaEntity?.name;
  }

  autoExpandInitialLevels(node: any, levelsRemaining: number): void {
    if (!node || levelsRemaining <= 0) {
      return;
    }
    this.expandedSet.add(node.id);
    const children = this.getChildren(node);
    for (const child of children) {
      this.autoExpandInitialLevels(child, levelsRemaining - 1);
    }
  }

  isExpanded(node: any): boolean {
    return this.expandedSet.has(node.id);
  }

  isLoading(node: any): boolean {
    return this.loadingNodes.has(node.id);
  }

  getChildren(node: any): any[] {
    if (!node) return [];
    if (Array.isArray(node.children)) {
      return node.children;
    }
    const config = this.getNodeConfig(node);
    if (config?.childRelationships) {
      const allChildren: any[] = [];
      for (const relName of config.childRelationships) {
        if (Array.isArray(node[relName])) {
          allChildren.push(...node[relName]);
        }
      }
      return allChildren;
    }
    return [];
  }

  hasChildren(node: any): boolean {
    if (!node) return false;
    const children = this.getChildren(node);
    return children.length > 0;
  }

  toggleNode(node: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.isExpanded(node)) {
      this.expandedSet.delete(node.id);
    } else {
      this.expandedSet.add(node.id);
      const children = this.getChildren(node);
      if (children.length === 0 && this.hasLazyChildren(node)) {
        this.loadLazyChildren(node);
      }
    }
    this.cdr.markForCheck();
  }

  onExpandedChange(node: any, expanded: boolean): void {
    if (expanded) {
      this.expandedSet.add(node.id);
      const children = this.getChildren(node);
      if (children.length === 0 && this.hasLazyChildren(node)) {
        this.loadLazyChildren(node);
      }
    } else {
      this.expandedSet.delete(node.id);
    }
    this.cdr.markForCheck();
  }

  hasLazyChildren(node: any): boolean {
    const childCount = node.child_count ?? node.childCount ?? node.children_count;
    return typeof childCount === 'number' && childCount > 0;
  }

  loadLazyChildren(node: any): void {
    const entityName = node.entityType || this.metaEntityName;
    if (!entityName || !node.id) {
      return;
    }

    this.loadingNodes.add(node.id);
    this.cdr.markForCheck();

    this.dataService.findChildren(entityName, node.id).subscribe({
      next: (response: any) => {
        node.children = response?.resultList || [];
        this.loadingNodes.delete(node.id);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error(`Failed to load children for node ${node.id}:`, err);
        this.loadingNodes.delete(node.id);
        this.cdr.markForCheck();
      }
    });
  }

  expandAll(): void {
    const expandRecursive = (nodes: any[]) => {
      for (const node of nodes) {
        this.expandedSet.add(node.id);
        const children = this.getChildren(node);
        if (children.length > 0) {
          expandRecursive(children);
        }
      }
    };
    expandRecursive(this.rootNodes);
    this.cdr.markForCheck();
  }

  collapseAll(): void {
    this.expandedSet.clear();
    for (const root of this.rootNodes) {
      this.expandedSet.add(root['id']);
    }
    this.cdr.markForCheck();
  }

  selectNode(node: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!node || !this.treeTool?.masterDetail) {
      return;
    }
    if (this.selectedNode && this.selectedNode.id === node.id) {
      return;
    }

    if (this.detailMode === 'edit') {
      this.confirmDiscardUnsavedChanges().subscribe((discard) => {
        if (discard) {
          this.doSelectNode(node);
        }
      });
      return;
    }

    this.doSelectNode(node);
  }

  private doSelectNode(node: any): void {
    this.selectedNode = node;
    this.loadDetail(node, 'view');
  }

  loadDetail(node: any, mode: 'view' | 'edit'): void {
    const entityType = node['entityType'] || this.metaEntityName;
    const nodeId = node['id'];
    if (!entityType || !nodeId) {
      return;
    }

    this.loadingDetail = true;
    this.errorDetail = null;
    this.cdr.markForCheck();

    this.formService.loadFormContext(entityType, mode, nodeId, null, null).subscribe({
      next: (ctx) => {
        this.detailCtx = ctx;
        this.detailMode = mode;
        this.originalDetailValueJson = JSON.stringify(this.getFormDataValue());
        this.loadingDetail = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(`Failed to load detail form for ${entityType}/${nodeId}:`, err);
        this.errorDetail = `Failed to load ${entityType} details`;
        this.loadingDetail = false;
        this.cdr.markForCheck();
      }
    });
  }

  onEdit(): void {
    if (!this.selectedNode) {
      return;
    }
    this.loadDetail(this.selectedNode, 'edit');
  }

  onCancelEdit(): void {
    if (!this.selectedNode) {
      return;
    }
    if (this.isDetailDirty()) {
      this.confirmDiscardUnsavedChanges().subscribe((discard) => {
        if (discard) {
          this.loadDetail(this.selectedNode, 'view');
        }
      });
    } else {
      this.loadDetail(this.selectedNode, 'view');
    }
  }

  onSaveNode(): void {
    if (!this.selectedNode || !this.detailCtx) {
      return;
    }
    const form = this.getDataForm(this.detailCtx);
    if (!form) {
      return;
    }

    this.validateAllFields('root', form);

    if (!form.valid) {
      this.toastService.showError('Error while saving. Please check form for errors.', true);
      this.cdr.markForCheck();
      return;
    }

    const entityType = this.selectedNode['entityType'] || this.metaEntityName;
    const entityData = form.value;

    const treeWalker = new MetaEntityTreeWalker(this.detailCtx.metaEntityMap, this.detailCtx.discriminatorMap);
    treeWalker.byType(AttributeType.Double, new DoubleVisitor());
    treeWalker.byType(AttributeType.Integer, new IntegerVisitor());
    treeWalker.byType(AttributeType.Identifier, new IdentifierVisitor());
    treeWalker.byType(AttributeType.Geometry, new GeometryVisitor());
    treeWalker.walk(entityData, this.detailCtx.metaEntity);

    this.savingDetail = true;
    this.cdr.markForCheck();

    this.dataService.save(entityType, entityData).subscribe({
      next: (response: SaveResponse) => {
        this.savingDetail = false;
        if (response.validationResults) {
          const validationResultController = new ValidationResultMapController(response.validationResults);
          if (validationResultController.hasErrors()) {
            this.saveRejected(this.detailCtx!, response);
            this.cdr.markForCheck();
            return;
          }
        }
        this.saveCompleted(response);
      },
      error: (err) => {
        console.error(`Failed to save ${entityType}:`, err);
        this.savingDetail = false;
        this.toastService.showError('Failed to save entity', true);
        this.cdr.markForCheck();
      }
    });
  }

  private saveRejected(ctx: FormContext, response: SaveResponse): void {
    this.toastService.showError('Error while saving. Please check form for errors.', true);
    const form = this.getDataForm(ctx);
    if (!form) return;
    const keys = Object.keys(response.validationResults);
    keys.forEach((k: string) => {
      const control = form.get(k);
      if (control) {
        control.setErrors(response.validationResults[k]);
      } else {
        const control_id_key = `${k}_id`;
        const control_id = form.get(control_id_key);
        if (control_id) {
          control_id.setErrors(response.validationResults[k]);
        }
      }
    });
  }

  private saveCompleted(response: SaveResponse): void {
    this.toastService.showSuccess('Save is successful');
    const nodeConfig = this.getNodeConfig(this.selectedNode);
    if (nodeConfig?.displayAttribute && response.entity?.[nodeConfig.displayAttribute]) {
      this.selectedNode[nodeConfig.displayAttribute] = response.entity[nodeConfig.displayAttribute];
    }
    this.loadDetail(this.selectedNode, 'view');
  }

  confirmDiscardUnsavedChanges(): Observable<boolean> {
    const modalRef = this.modalService.open(MessageDialogComponent);
    const modalComponent: MessageDialogComponent = modalRef.componentInstance;
    modalComponent.title = 'Unsaved Changes';
    modalComponent.text = 'You have unsaved changes that will be lost. Do you want to discard your changes and continue?';
    modalComponent.actions = [
      { name: 'Cancel', style: 'btn btn-outline-primary' },
      { name: 'Discard', style: 'btn btn-danger' }
    ];
    modalComponent.cdr?.detectChanges();

    return from(modalRef.result).pipe(
      map(result => result === 'Discard'),
      catchError(() => of(false))
    );
  }

  isDetailDirty(): boolean {
    if (this.detailMode !== 'edit' || !this.detailCtx?.formMap) {
      return false;
    }
    for (const form of this.detailCtx.formMap.values()) {
      if (form.dirty) {
        return true;
      }
    }
    if (this.originalDetailValueJson && this.detailCtx.formMap.size > 0) {
      const current = JSON.stringify(this.getFormDataValue());
      return current !== this.originalDetailValueJson;
    }
    return false;
  }

  getDataForm(ctx: FormContext | null): UntypedFormGroup | null {
    if (!ctx?.formMap) return null;
    return (ctx.formMap.values().next().value as UntypedFormGroup) ?? null;
  }

  private getFormDataValue(): any {
    const form = this.getDataForm(this.detailCtx);
    return form ? form.value : null;
  }

  private validateAllFields(name: string, abstractControl: AbstractControl): void {
    abstractControl.updateValueAndValidity();
    abstractControl.markAsTouched();

    if (abstractControl instanceof UntypedFormGroup) {
      const fg = abstractControl as UntypedFormGroup;
      Object.keys(fg.controls).forEach(key => {
        this.validateAllFields(key, fg.controls[key]);
      });
    } else if (abstractControl instanceof UntypedFormArray) {
      const fa = abstractControl as UntypedFormArray;
      fa.controls.forEach((control, index) => {
        this.validateAllFields(`${name}[${index}]`, control);
      });
    }
  }

  isSelected(node: any): boolean {
    return this.selectedNode && this.selectedNode['id'] === node['id'];
  }

  getDetailContentTemplates(): Template[] {
    if (!this.detailCtx?.metaPage?.templates) {
      return [];
    }
    return this.detailCtx.metaPage.templates.filter(t => t.type !== 'header');
  }

  getNodeEditRoute(node: any): any[] {
    const entityType = node['entityType'] || this.metaEntityName;
    return ['/data', entityType, 'view_edit', node['id']];
  }

  getMasterColumnClass(): string {
    const ratio = this.treeTool?.splitRatio ?? 4;
    return `col-lg-${ratio} col-md-5 mb-3`;
  }

  getDetailColumnClass(): string {
    const ratio = this.treeTool?.splitRatio ?? 4;
    const detailRatio = 12 - ratio;
    return `col-lg-${detailRatio} col-md-7`;
  }

  getNodeConfig(node: any): TreeNodeTypeConfig | undefined {
    const entityType = node['entityType'] || (node === this.rootNodes[0] ? this.metaEntityName : undefined);
    if (entityType && this.treeTool?.nodeTypes?.[entityType]) {
      return this.treeTool.nodeTypes[entityType];
    }
    return undefined;
  }

  getNodeLabel(node: any): string {
    if (!node) return '';
    const config = this.getNodeConfig(node);
    if (config?.displayAttribute && node[config.displayAttribute]) {
      return node[config.displayAttribute];
    }
    if (this.treeTool?.displayAttribute && node[this.treeTool.displayAttribute]) {
      return node[this.treeTool.displayAttribute];
    }
    if (node['label']) return node['label'];
    if (node['protocol_name']) return node['protocol_name'];
    if (node['activity_template_name']) return node['activity_template_name'];
    if (node['assertion_type_name']) return node['assertion_type_name'];
    if (node['scientific_name']) return node['scientific_name'];
    if (node['name']) return node['name'];
    if (node['title']) return node['title'];
    return node['id'] || 'Unnamed Node';
  }

  getSecondaryLabel(node: any): string | null {
    if (!node) return null;
    const config = this.getNodeConfig(node);
    if (config?.secondaryAttribute && node[config.secondaryAttribute]) {
      return node[config.secondaryAttribute];
    }
    if (this.treeTool?.secondaryAttribute && node[this.treeTool.secondaryAttribute]) {
      return node[this.treeTool.secondaryAttribute];
    }
    return null;
  }

  getBadgeValue(node: any): string | null {
    if (!node) return null;
    const config = this.getNodeConfig(node);
    if (config?.badge) {
      return config.badge;
    }
    if (this.treeTool?.badgeAttribute && node[this.treeTool.badgeAttribute]) {
      return node[this.treeTool.badgeAttribute];
    }
    if (node['rank']) return node['rank'];
    return null;
  }

  readonly badgeColorPalette: string[] = [
    'text-bg-primary',
    'text-bg-success',
    'text-bg-info',
    'text-bg-warning',
    'text-bg-danger',
    'text-bg-dark',
    'text-bg-secondary',
  ];

  private readonly badgeColorMap = new Map<string, string>();

  getBadgeColorForValue(badge: string): string {
    if (!this.badgeColorMap.has(badge)) {
      const index = this.badgeColorMap.size % this.badgeColorPalette.length;
      this.badgeColorMap.set(badge, this.badgeColorPalette[index]);
    }
    return this.badgeColorMap.get(badge)!;
  }

  getBadgeClass(node: any): string {
    if (!node) return 'text-bg-secondary';
    const config = this.getNodeConfig(node);
    const badgeColor = config?.badgeColor || config?.badgeClass || node['badgeColor'] || node['badge_color'] || node['badgeClass'];
    if (badgeColor) {
      if (badgeColor.startsWith('#') || badgeColor.startsWith('rgb')) {
        return '';
      }
      if (badgeColor.startsWith('text-bg-') || badgeColor.startsWith('bg-')) {
        return badgeColor;
      }
      return `text-bg-${badgeColor}`;
    }
    const badge = this.getBadgeValue(node);
    if (!badge) return 'text-bg-secondary';
    return this.getBadgeColorForValue(badge);
  }

  getBadgeStyle(node: any): { [key: string]: string } | null {
    if (!node) return null;
    const config = this.getNodeConfig(node);
    const badgeColor = config?.badgeColor || node['badgeColor'] || node['badge_color'];
    if (badgeColor && (badgeColor.startsWith('#') || badgeColor.startsWith('rgb'))) {
      return { 'background-color': badgeColor };
    }
    return null;
  }

  getNodeIcon(node: any): string {
    if (!node) return 'description';
    const config = this.getNodeConfig(node);
    if (config?.icon) {
      return config.icon;
    }
    return 'description';
  }

  getNodeRoute(node: any): any[] | string {
    if (!node) return [];
    const config = this.getNodeConfig(node);
    if (config?.route) {
      return config.route.replace('${id}', node.id);
    }
    if (this.treeTool?.route) {
      return this.treeTool.route.replace('${id}', node.id);
    }
    const entityType = node.entityType || this.metaEntityName;
    return ['/data', entityType, 'view', node.id];
  }

  onEditorModeClick(): void {
    if (this.editorMode) {
      this.propertySheetService.edit('Tree Tool', this.treeTool);
    }
  }
}
