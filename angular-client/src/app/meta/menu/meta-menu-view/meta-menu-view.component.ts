import { Component, OnInit } from '@angular/core';
import {Observable, of, tap} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {MenuItem, MetaMenu} from '../../../domain/meta.menu';
import {MetaMenuService} from '../meta-menu-service/meta-menu.service';
import {MenuItemAddEvent} from './menu-item-view/menu-item-view.component';

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

  onMenuItemAdded(metaMenu: MetaMenu, colIdx: number, menuItemAddEvent: MenuItemAddEvent) {
    const menu = metaMenu.menuList[colIdx];
    const idx = menuItemAddEvent.position;
    const menuItem = menuItemAddEvent.menuItem;
    menu.items.splice(idx, 0, menuItem);

    this.examine(metaMenu);
    this.metaMenu$ = of(metaMenu);
  }
}