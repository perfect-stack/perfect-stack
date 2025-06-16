import {Inject, Injectable} from '@angular/core';
import {LoginNotification} from './login-notification';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationClientService {

  constructor(protected readonly http: HttpClient, @Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig) { }

  sendNotification(bearerToken: string) {
    console.log(`Sending login notification`);
    return this.http.post<LoginNotification>(`${this.stackConfig.apiUrl}/authentication/notification`, {
      bearerToken: bearerToken
    });
  }

  findLastSignIn(username: string) {
    return this.http.get(`${this.stackConfig.apiUrl}/authentication/last-sign-in/${username}`);
  }

}
