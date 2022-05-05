import {Component, Input, OnInit} from '@angular/core';
import {AuthenticationService} from '../authentication/authentication.service';
import {MetaMenuService} from '../meta/menu/meta-menu-service/meta-menu.service';

@Component({
  selector: 'lib-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css']
})
export class MenuBarComponent implements OnInit {

  @Input()
  applicationTitle = 'Title';

  @Input()
  applicationTitleFont = 'Serif';

  @Input()
  applicationLogo: string;

  @Input()
  applicationLogoWidth: string;

  @Input()
  menuBarDividerColor: string;

  @Input()
  menuBarBackgroundColor: string;


  constructor(public readonly authenticationService: AuthenticationService,
              public readonly metaMenuService: MetaMenuService) {}

  ngOnInit(): void {
  }

}
