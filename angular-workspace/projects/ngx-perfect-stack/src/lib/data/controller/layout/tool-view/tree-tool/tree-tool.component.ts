import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {TreeNodeTypeConfig, TreeTool} from '../../../../../domain/meta.page';
import {DataService} from '../../../../data-service/data.service';
import {MetaEntityService} from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import {MetaEntity} from '../../../../../domain/meta.entity';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';

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

  constructor(
    protected readonly dataService: DataService,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly propertySheetService: PropertySheetService,
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
        for (const root of this.rootNodes) {
          this.autoExpandInitialLevels(root, 2);
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

  get metaEntityName(): string {
    return this.treeTool?.metaEntityName || this.ctx?.metaEntity?.name || this.ctx?.metaName || '';
  }

  private autoExpandInitialLevels(node: any, maxLevel: number, currentLevel = 0): void {
    if (!node || currentLevel >= maxLevel) {
      return;
    }
    this.expandedSet.add(node['id']);
    const children = node['children'];
    if (children && children.length > 0) {
      for (const child of children) {
        this.autoExpandInitialLevels(child, maxLevel, currentLevel + 1);
      }
    }
  }

  isExpanded(node: any): boolean {
    return this.expandedSet.has(node['id']);
  }

  isLoading(node: any): boolean {
    return this.loadingNodes.has(node['id']);
  }

  hasChildren(node: any): boolean {
    if (!node) return false;
    if (node['children'] && node['children'].length > 0) {
      return true;
    }
    if (node['isLeaf'] === true || node['is_leaf'] === true || node['_noChildren'] === true) {
      return false;
    }
    if (node['rank'] === 'Species') {
      return false;
    }
    if (node['_loaded'] && (!node['children'] || node['children'].length === 0)) {
      return false;
    }
    if (this.treeTool?.treeType === 'EntityChain') {
      return false;
    }
    return true;
  }

  onExpandedChange(node: any, expanded: boolean): void {
    const nodeId = node['id'];
    if (expanded) {
      if (!this.expandedSet.has(nodeId)) {
        this.expandedSet.add(nodeId);
        this.checkLazyLoad(node);
      }
    } else {
      this.expandedSet.delete(nodeId);
    }
    this.cdr.markForCheck();
  }

  toggleNode(node: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const nodeId = node['id'];
    if (this.isExpanded(node)) {
      this.expandedSet.delete(nodeId);
    } else {
      this.expandedSet.add(nodeId);
      this.checkLazyLoad(node);
    }
    this.cdr.markForCheck();
  }

  private checkLazyLoad(node: any): void {
    const nodeId = node['id'];
    const children = node['children'];
    const entityType = node['entityType'] || this.metaEntityName;
    if ((!children || children.length === 0) && !node['_loaded'] && entityType) {
      this.loadingNodes.add(nodeId);
      this.cdr.markForCheck();
      this.dataService.findSubTree(entityType, nodeId, 2, this.treeTool?.treeType).subscribe({
        next: (subTree: any) => {
          this.loadingNodes.delete(nodeId);
          node['_loaded'] = true;
          if (subTree && subTree['children'] && subTree['children'].length > 0) {
            node['children'] = subTree['children'];
          } else {
            node['children'] = [];
            node['_noChildren'] = true;
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingNodes.delete(nodeId);
          console.error(`Failed to load subtree for node ${nodeId}:`, err);
          this.cdr.markForCheck();
        }
      });
    }
  }

  expandAll(): void {
    for (const root of this.rootNodes) {
      this.expandAllRecursive(root);
    }
    this.cdr.markForCheck();
  }

  private expandAllRecursive(node: any): void {
    if (!node) return;
    this.expandedSet.add(node['id']);
    const children = node['children'];
    if (children) {
      for (const child of children) {
        this.expandAllRecursive(child);
      }
    }
  }

  collapseAll(): void {
    this.expandedSet.clear();
    for (const root of this.rootNodes) {
      this.expandedSet.add(root['id']);
    }
    this.cdr.markForCheck();
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
    if (node['secondaryLabel']) return node['secondaryLabel'];
    if (node['common_name']) return node['common_name'];
    if (node['code']) return node['code'];
    return null;
  }

  getBadgeValue(node: any): string | null {
    if (!node) return null;
    const config = this.getNodeConfig(node);
    if (config?.badge) {
      return config.badge;
    }
    if (config?.badgeAttribute && node[config.badgeAttribute]) {
      return node[config.badgeAttribute];
    }
    if (this.treeTool?.badgeAttribute && node[this.treeTool.badgeAttribute]) {
      return node[this.treeTool.badgeAttribute];
    }
    if (node['badge']) return node['badge'];
    if (node['rank']) return node['rank'];
    if (node['unit_type']) return node['unit_type'];
    return null;
  }

  getNodeIcon(node: any): string {
    const config = this.getNodeConfig(node);
    if (config?.icon) {
      return config.icon;
    }
    if (node['icon']) {
      return node['icon'];
    }
    return this.hasChildren(node)
      ? (this.isExpanded(node) ? 'folder_open' : 'folder')
      : 'subdirectory_arrow_right';
  }

  getNodeRoute(node: any): string | any[] {
    const entityType = node['entityType'] || this.metaEntityName;
    const config = this.getNodeConfig(node);
    if (config?.route) {
      return config.route
        .replace('${metaEntityName}', entityType)
        .replace('${id}', node['id']);
    }
    if (node['route']) {
      return node['route'];
    }
    if (this.treeTool?.route) {
      return this.treeTool.route
        .replace('${metaEntityName}', entityType)
        .replace('${id}', node['id']);
    }
    return ['/data', entityType, 'view_edit', node['id']];
  }

  onEditorModeClick(): void {
    this.propertySheetService.edit('Tree Tool', this.treeTool);
  }
}
