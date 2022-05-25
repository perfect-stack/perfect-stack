import {Inject, Injectable} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';

@Injectable({
  providedIn: 'root'
})
export class DebugService {

  public ON: boolean;

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig) {
    this.ON = stackConfig.debug;
  }

  toggleDebug() {
    this.ON = !this.ON;
  }
}
