import { Component, OnInit } from '@angular/core';
import {Observable, of, tap} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {MenuItem, MetaMenu} from '../../../domain/meta.menu';
import {MetaMenuService} from '../meta-menu-service/meta-menu.service';

@Component({
  selector: 'app-meta-menu-view',
  templateUrl: './meta-menu-view.component.html',
  styleUrls: ['./meta-menu-view.component.css']
})
export class MetaMenuViewComponent implements OnInit {

  public metaMenu$: Observable<MetaMenu>;

  public columnCount = 0;
  public rowCount = 0;

  public columnNumbers: number[] = [];
  public rowNumbers: number[] = [];

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaMenuService: MetaMenuService) {
  }

  ngOnInit(): void {
    this.metaMenu$ = this.metaMenuService.find().pipe(
      tap(menu => {
        this.examine(menu);
      })
    );
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
    if(rowIdx < menu.items.length) {
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

  onMenuAdded(metaMenu: MetaMenu, colIdx: number) {
    const newMenu = {
      label: 'Label',
      items: [{
        label: 'Label',
        route: '/route/here',
        editable: true,
        roles: []
      }]
    };

    // this is deliberately not +1 to add to the "left" (see onMenuItemAdded)
    metaMenu.menuList.splice(colIdx, 0, newMenu);

    this.examine(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onMenuDeleted(metaMenu: MetaMenu, colIdx: number) {
    metaMenu.menuList.splice(colIdx, 1);

    this.examine(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onMenuMove(metaMenu: MetaMenu, colIdx: number, direction: number) {
    const targetColIdx = colIdx + direction;
    const canMove = targetColIdx >= 0 && targetColIdx <= (metaMenu.menuList.length - 1);
    if(canMove) {
      const sourceMenu = metaMenu.menuList[colIdx];
      const targetMenu = metaMenu.menuList[targetColIdx]
      metaMenu.menuList[targetColIdx] = sourceMenu;
      metaMenu.menuList[colIdx] = targetMenu;
    }

    this.examine(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onMenuItemAdded(metaMenu: MetaMenu, colIdx: number, rowIdx: number, menuItem: MenuItem) {
    const menu = metaMenu.menuList[colIdx];
    // this is deliberately +1 to add to the end of the list
    menu.items.splice(rowIdx + 1, 0, menuItem);

    this.examine(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onMenuItemDeleted(metaMenu: MetaMenu, colIdx: number, rowIdx: number) {
    const menu = metaMenu.menuList[colIdx];
    menu.items.splice(rowIdx, 1);
    this.examine(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }

  onMenuItemMoved(metaMenu: MetaMenu, colIdx: number, rowIdx: number, direction: number) {
    const menu = metaMenu.menuList[colIdx];
    const targetRowIdx = rowIdx + direction;
    const canMove = targetRowIdx >= 0 && targetRowIdx <= (menu.items.length - 1);
    if(canMove) {
      const sourceMenuItem = menu.items[rowIdx];
      const targetMenuItem = menu.items[targetRowIdx]
      menu.items[targetRowIdx] = sourceMenuItem;
      menu.items[rowIdx] = targetMenuItem;
    }

    this.examine(metaMenu);
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
      this.metaMenu$ = of(metaMenu);
    }
  }

  onSaveMetaMenu(metaMenu: MetaMenu) {
    this.metaMenuService.update(metaMenu).subscribe(() => {
      console.log('Meta Menu updated')
    });
  }
}
