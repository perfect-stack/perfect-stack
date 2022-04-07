import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'lib-ngx-perfect-stack',
  template: `<lib-menu-bar [applicationName]="applicationName"></lib-menu-bar>`,
  styles: [
  ]
})
export class NgxPerfectStackComponent implements OnInit {

  @Input()
  applicationName = 'Perfect-Stack';

  constructor() { }

  ngOnInit(): void {
  }
}
