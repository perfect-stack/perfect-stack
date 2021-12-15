import {Component, Input, OnInit} from '@angular/core';
import {MenuItem} from '../../../../domain/meta.menu';

@Component({
  selector: 'app-menu-item-view',
  templateUrl: './menu-item-view.component.html',
  styleUrls: ['./menu-item-view.component.css']
})
export class MenuItemViewComponent implements OnInit {

  @Input()
  public menuItem: MenuItem | null;

  constructor() { }

  ngOnInit(): void {
  }

}
