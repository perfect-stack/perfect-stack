import {Component, Input, OnInit} from '@angular/core';
import {MenuItem} from '../../../../domain/meta.menu';

@Component({
  selector: 'app-menu-header-view',
  templateUrl: './menu-header-view.component.html',
  styleUrls: ['./menu-header-view.component.css']
})
export class MenuHeaderViewComponent implements OnInit {

  @Input()
  public menuItem: MenuItem | null;

  constructor() { }

  ngOnInit(): void {
  }

}
