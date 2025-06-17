import {Component, Inject} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";

@Component({
    selector: 'lib-environment-banner',
    templateUrl: './environment-banner.component.html',
    styleUrls: ['./environment-banner.component.css'],
    standalone: false
})
export class EnvironmentBannerComponent {


  constructor(@Inject(STACK_CONFIG) public readonly stackConfig: NgxPerfectStackConfig) {
  }
}
