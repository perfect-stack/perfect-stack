import { Component, HostListener, OnInit } from '@angular/core';
import { catchError, from, map, Observable, of, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, Menu, MetaMenu, OpenIn } from '../../../domain/meta.menu';
import { MetaMenuService } from '../meta-menu-service/meta-menu.service';
import { ComponentCanDeactivate } from '../../../utils/can-deactivate.guard';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MessageDialogComponent } from '../../../utils/message-dialog/message-dialog.component';
import { ToastService } from '../../../utils/toasts/toast.service';
import { ClientConfigService } from '../../../client/config/client-config.service';

@Component({
    selector: 'lib-meta-menu-view',
    templateUrl: './meta-menu-view.component.html',
    styleUrls: ['./meta-menu-view.component.css'],
    standalone: false
})
export class MetaMenuViewComponent implements OnInit, ComponentCanDeactivate {

  public metaMenu$: Observable<MetaMenu>;
  public isMetaEditEnabled$: Observable<boolean>;

  public columnCount = 0;
  public rowCount = 0;

  public columnNumbers: number[] = [];
  public rowNumbers: number[] = [];

  public isDirty = false;
  private originalMenuJson = '';

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaMenuService: MetaMenuService,
              protected readonly clientConfigService: ClientConfigService,
              protected readonly modalService: NgbModal,
              protected readonly toastService: ToastService) {
  }

  ngOnInit(): void {
    this.isMetaEditEnabled$ = this.clientConfigService.isMetaEditEnabled('Menu');
    this.metaMenu$ = this.metaMenuService.find().pipe(
      tap(menu => {
        this.originalMenuJson = JSON.stringify(menu);
        this.isDirty = false;
        this.examine(menu);
      })
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (!this.isDirty) {
      return true;
    }
    return this.confirmDiscardUnsavedChanges().pipe(
      tap(canLeave => {
        if (canLeave) {
          this.isDirty = false;
        }
      })
    );
  }

  confirmDiscardUnsavedChanges(): Observable<boolean> {
    const modalRef = this.modalService.open(MessageDialogComponent);
    const modalComponent: MessageDialogComponent = modalRef.componentInstance;
    modalComponent.title = 'Unsaved Changes';
    modalComponent.text = 'You have unsaved changes that will be lost if you leave this page. Do you want to discard your changes and continue?';
    modalComponent.actions = [
      { name: 'Cancel', style: 'btn btn-outline-primary' },
      { name: 'Discard', style: 'btn btn-danger' }
    ];

    return from(modalRef.result).pipe(
      map(result => result === 'Discard'),
      catchError(() => of(false))
    );
  }

  private checkDirty(metaMenu: MetaMenu) {
    this.isDirty = JSON.stringify(metaMenu) !== this.originalMenuJson;
  }

  private examine(menu: MetaMenu) {
    this.columnCount = menu.menuList.length;
    for(let i = 0; i < this.columnCount; i++) {
      const nextMenu = menu.menuList[i];
      if(this.rowCount < nextMenu.items.length) {
        this.rowCount = nextMenu.items.length;
      }
    }

    this.columnNumbers = Array(this.columnCount).fill(this.columnCount).map((x,i) => i);
    this.rowNumbers = Array(this.rowCount).fill(this.rowCount).map((x,i) => i);
  }

  getMenu(metaMenu: MetaMenu, colIdx: number) {
    return metaMenu.menuList[colIdx];
  }

  getMenuItem(metaMenu: MetaMenu, colIdx: number, rowIdx: number) {
    let menuItem = null;
    const menu = this.getMenu(metaMenu, colIdx);
    if(menu && rowIdx < menu.items.length) {
      menuItem = menu.items[rowIdx];
    }
    return menuItem;
  }

  onEdit() {
    this.router.navigate(['/meta/menu/edit']);
  }

  onBack(menuItem: MenuItem | null) {
    if(menuItem) {
      this.router.navigate([menuItem.route]);
    }
  }

  onCancel(metaMenu?: MetaMenu) {
    if (!this.isDirty) {
      return;
    }
    this.confirmDiscardUnsavedChanges().subscribe(discard => {
      if (discard) {
        this.revertChanges();
      }
    });
  }

  private revertChanges() {
    if (this.originalMenuJson) {
      const original: MetaMenu = JSON.parse(this.originalMenuJson);
      this.examine(original);
      this.metaMenu$ = of(original);
      this.isDirty = false;
    }
  }

  onMenuAdded(metaMenu: MetaMenu, colIdx: number) {
    const newMenu = {
      label: 'Label',
      items: [{
        label: 'Label',
        route: '/route/here',
        editable: true,
        roles: [],
        openIn: OpenIn.Current
      }]
    };

    // this is deliberately not +1 to add to the "left" (see onMenuItemAdded)
    metaMenu.menuList.splice(colIdx, 0, newMenu);

    this.examine(metaMenu);
    this.checkDirty(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onAddColumn(metaMenu: MetaMenu) {
    this.onMenuAdded(metaMenu, metaMenu.menuList.length);
  }

  onMenuDeleted(metaMenu: MetaMenu, colIdx: number) {
    metaMenu.menuList.splice(colIdx, 1);

    this.examine(metaMenu);
    this.checkDirty(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onMove(metaMenu: MetaMenu, colIdx: number, direction: number) {
    const targetColIdx = colIdx + direction;
    const canMove = targetColIdx >= 0 && targetColIdx <= (metaMenu.menuList.length - 1);
    if(canMove) {
      const sourceMenu = metaMenu.menuList[colIdx];
      const targetMenu = metaMenu.menuList[targetColIdx];
      metaMenu.menuList[targetColIdx] = sourceMenu;
      metaMenu.menuList[colIdx] = targetMenu;
    }

    this.examine(metaMenu);
    this.checkDirty(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onMenuEdited(metaMenu: MetaMenu) {
    this.checkDirty(metaMenu);
  }

  onMenuItemAdded(metaMenu: MetaMenu, colIdx: number, rowIdx: number, menuItem: MenuItem) {
    const menu = metaMenu.menuList[colIdx];
    // this is deliberately +1 to add to the end of the list
    menu.items.splice(rowIdx + 1, 0, menuItem);

    this.examine(metaMenu);
    this.checkDirty(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onAddItem(metaMenu: MetaMenu, colIdx: number) {
    const newItem = new MenuItem();
    newItem.label = 'Label';
    newItem.route = '/route/here';
    newItem.openIn = OpenIn.Current;
    const menu = metaMenu.menuList[colIdx];
    menu.items.push(newItem);
    this.examine(metaMenu);
    this.checkDirty(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onMenuItemDeleted(metaMenu: MetaMenu, colIdx: number, rowIdx: number) {
    const menu = metaMenu.menuList[colIdx];
    menu.items.splice(rowIdx, 1);
    this.examine(metaMenu);
    this.checkDirty(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onMenuItemMoved(metaMenu: MetaMenu, colIdx: number, rowIdx: number, direction: number) {
    const menu = metaMenu.menuList[colIdx];
    const targetRowIdx = rowIdx + direction;
    const canMove = targetRowIdx >= 0 && targetRowIdx <= (menu.items.length - 1);
    if(canMove) {
      const sourceMenuItem = menu.items[rowIdx];
      const targetMenuItem = menu.items[targetRowIdx];
      menu.items[targetRowIdx] = sourceMenuItem;
      menu.items[rowIdx] = targetMenuItem;
    }

    this.examine(metaMenu);
    this.checkDirty(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onMenuItemMenuMoved(metaMenu: MetaMenu, colIdx: number, rowIdx: number, direction: number) {
    console.log(`onMenuItemMenuMoved: ${colIdx}, ${rowIdx}`);
    const targetMenuIdx = colIdx + direction;
    const canMove = targetMenuIdx >= 0 && targetMenuIdx <= (metaMenu.menuList.length - 1);
    if(canMove) {
      const sourceMenu = metaMenu.menuList[colIdx];
      const targetMenu = metaMenu.menuList[targetMenuIdx];
      const sourceItem = sourceMenu.items[rowIdx];
      let targetRowIdx = rowIdx;
      if(targetRowIdx > (targetMenu.items.length - 1)) {
        targetRowIdx = targetMenu.items.length;
      }

      targetMenu.items.splice(targetRowIdx, 0, sourceItem);
      sourceMenu.items.splice(rowIdx, 1);

      this.examine(metaMenu);
      this.checkDirty(metaMenu);
      this.metaMenu$ = of(metaMenu);
    }
  }

  onMenuItemEdited(metaMenu: MetaMenu) {
    this.checkDirty(metaMenu);
  }

  onSaveMetaMenu(metaMenu: MetaMenu) {
    this.metaMenuService.update(metaMenu).subscribe(() => {
      console.log('Meta Menu updated');
      this.originalMenuJson = JSON.stringify(metaMenu);
      this.isDirty = false;
      this.toastService.showSuccess('Meta menu saved successfully');
    });
  }
}
