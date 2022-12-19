import {Component, Inject, Input, OnInit} from '@angular/core';
import {LastSignInTool} from '../../../../../domain/meta.page';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {ExpressionService} from '../../controls/expression-control/expression.service';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';
import {Locale} from '@js-joda/locale_en';
import {DateTimeFormatter, Instant, LocalTime, ZonedDateTime, ZoneId} from '@js-joda/core';
import {AuthenticationClientService} from '../../../../../authentication/authentication-client.service';

@Component({
  selector: 'lib-last-sign-in-tool',
  templateUrl: './last-sign-in-tool.component.html',
  styleUrls: ['./last-sign-in-tool.component.css']
})
export class LastSignInToolComponent implements OnInit {

  @Input()
  lastSignInTool: LastSignInTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  username: string;
  authentication: any;
  lastSignInTime: string;

  constructor(protected readonly propertySheetService: PropertySheetService,
              @Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly expressionService: ExpressionService,
              protected readonly authenticationClientService: AuthenticationClientService) {
    Locale.getAvailableLocales();
  }

  ngOnInit(): void {
    if(this.editorMode) {
      const zonedDateTime = ZonedDateTime.now(ZoneId.of('Pacific/Auckland'));
      this.updateLastSignInTime(zonedDateTime);
    } else {
      if(this.ctx && this.ctx.dataMap) {
        this.username = this.expressionService.evaluate(this.lastSignInTool.username, this.ctx.dataMap);
      }
      else {
        this.username = this.lastSignInTool.username;
      }

      this.authenticationClientService.findLastSignIn(this.username).subscribe((authentication: any) => {
        this.authentication = authentication;
        if(authentication) {
          const utc = Instant.parse(authentication.auth_time);
          const zonedDateTime = ZonedDateTime.ofInstant(utc, ZoneId.of('Pacific/Auckland'));
          this.updateLastSignInTime(zonedDateTime);
        }
      });
    }
  }

  updateLastSignInTime(zonedDateTime: ZonedDateTime) {
    if(zonedDateTime) {
      const dateTimeFormat = this.stackConfig.dateTimeFormat;
      const dateTimeFormatter = DateTimeFormatter.ofPattern(dateTimeFormat).withLocale(Locale.US);
      this.lastSignInTime = dateTimeFormatter.format(zonedDateTime);
    }
    else {
      this.lastSignInTime = '';
    }
  }

  onClick($event: MouseEvent) {
    if(this.editorMode) {
      this.doEditorAction();
    }
  }

  doEditorAction() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Last SignIn', this.lastSignInTool);
  }
}
