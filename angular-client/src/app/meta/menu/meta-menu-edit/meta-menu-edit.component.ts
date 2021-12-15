import { Component, OnInit } from '@angular/core';
import {Observable, tap} from 'rxjs';
import {MetaMenu} from '../../../domain/meta.menu';
import {ActivatedRoute, Router} from '@angular/router';
import {MetaMenuService} from '../meta-menu-service/meta-menu.service';

@Component({
  selector: 'app-meta-menu-edit',
  templateUrl: './meta-menu-edit.component.html',
  styleUrls: ['./meta-menu-edit.component.css']
})
export class MetaMenuEditComponent implements OnInit {

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
      if(this.rowCount < nextMenu.length) {
        this.rowCount = nextMenu.length;
      }
    }

    this.columnNumbers = Array(this.columnCount).fill(this.columnCount).map((x,i) => i);
    this.rowNumbers = Array(this.rowCount).fill(this.rowCount).map((x,i) => i);
  }

  getMenuItem(metaMenu: MetaMenu, colIdx: number, rowIdx: number) {
    let menuItem = null;
    const menu = metaMenu.menuList[colIdx];
    if(rowIdx < menu.length) {
      menuItem = menu[rowIdx];
    }
    return menuItem;
  }

  onCancel() {

  }

  onSave() {

  }

}
