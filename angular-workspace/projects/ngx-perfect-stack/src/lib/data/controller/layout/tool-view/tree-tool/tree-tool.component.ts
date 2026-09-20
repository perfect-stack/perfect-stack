import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {TreeTool} from '../../../../../domain/meta.page';
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

  rootNode: any | null = null;
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
    this.dataService.findRootTree(entityName, depth).subscribe({
      next: (treeRoot) => {
        this.rootNode = treeRoot;
        this.loading = false;
        if (treeRoot) {
          this.autoExpandInitialLevels(treeRoot, 2);
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
    if (node['is_leaf'] === true || node['_noChildren'] === true) {
      return false;
    }
    if (node['rank'] === 'Species') {
      return false;
    }
    if (node['_loaded'] && (!node['children'] || node['children'].length === 0)) {
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
    if ((!children || children.length === 0) && !node['_loaded'] && this.metaEntityName) {
      this.loadingNodes.add(nodeId);
      this.cdr.markForCheck();
      this.dataService.findSubTree(this.metaEntityName, nodeId, 2).subscribe({
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
    if (this.rootNode) {
      this.expandAllRecursive(this.rootNode);
      this.cdr.markForCheck();
    }
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
    if (this.rootNode) {
      // Keep root node expanded
      this.expandedSet.add(this.rootNode['id']);
    }
    this.cdr.markForCheck();
  }

  getNodeLabel(node: any): string {
    if (!node) return '';
    if (this.treeTool?.displayAttribute && node[this.treeTool.displayAttribute]) {
      return node[this.treeTool.displayAttribute];
    }
    if (node['scientific_name']) return node['scientific_name'];
    if (node['name']) return node['name'];
    if (node['label']) return node['label'];
    if (node['title']) return node['title'];
    return node['id'] || 'Unnamed Node';
  }

  getSecondaryLabel(node: any): string | null {
    if (!node) return null;
    if (this.treeTool?.secondaryAttribute && node[this.treeTool.secondaryAttribute]) {
      return node[this.treeTool.secondaryAttribute];
    }
    if (node['common_name']) return node['common_name'];
    if (node['code']) return node['code'];
    return null;
  }

  getBadgeValue(node: any): string | null {
    if (!node) return null;
    if (this.treeTool?.badgeAttribute && node[this.treeTool.badgeAttribute]) {
      return node[this.treeTool.badgeAttribute];
    }
    if (node['rank']) return node['rank'];
    if (node['unit_type']) return node['unit_type'];
    return null;
  }

  getNodeRoute(node: any): string | any[] {
    if (this.treeTool?.route) {
      return this.treeTool.route
        .replace('${metaEntityName}', this.metaEntityName)
        .replace('${id}', node['id']);
    }
    return ['/data', this.metaEntityName, 'view', node['id']];
  }

  onEditorModeClick(): void {
    this.propertySheetService.edit('Tree Tool', this.treeTool);
  }
}
