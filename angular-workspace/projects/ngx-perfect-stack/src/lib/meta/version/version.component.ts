import {Component, Inject, OnInit} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';
import {HttpClient} from '@angular/common/http';
import {DebugService} from '../../utils/debug/debug.service';

@Component({
  selector: 'lib-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.css']
})
export class VersionComponent implements OnInit {

  clientVersion = '';
  serverVersion = '';

  style: 'Page' | 'Footer' = 'Page';

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              public readonly debugService: DebugService,
              protected readonly http: HttpClient) { }

  ngOnInit(): void {
    this.clientVersion = this.stackConfig.clientRelease;

    this.http.get(`${this.stackConfig.apiUrl}/meta/menu/version`).subscribe((a: any) => {
      this.serverVersion = a.serverRelease;
    });
  }

  onToggleDebug() {
    this.debugService.toggleDebug();
  }
}
