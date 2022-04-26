import {Component, Inject, OnInit} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'lib-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.css']
})
export class VersionComponent implements OnInit {

  clientVersion = '';
  serverVersion = '';

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly http: HttpClient) { }

  ngOnInit(): void {
    this.clientVersion = this.stackConfig.clientRelease;

    this.http.get(`${this.stackConfig.apiUrl}/meta/menu/version`).subscribe((a: any) => {
      this.serverVersion = a.serverRelease;
    });
  }
}
