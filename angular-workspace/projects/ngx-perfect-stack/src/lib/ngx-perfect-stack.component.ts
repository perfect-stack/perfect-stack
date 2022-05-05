import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'lib-ngx-perfect-stack',
  template: `<lib-menu-bar [applicationTitle]="applicationTitle" [applicationTitleFont]="applicationTitleFont" [applicationLogo]="applicationLogo"></lib-menu-bar>`,
  styles: [
  ]
})
export class NgxPerfectStackComponent implements OnInit {

  @Input()
  applicationTitle: string;

  @Input()
  applicationTitleFont: string;

  @Input()
  applicationLogo: string;

  constructor() { }

  ngOnInit(): void {
  }
}
