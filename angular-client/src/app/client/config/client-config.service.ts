import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientConfigService {

  constructor(protected readonly http: HttpClient) { }

  getConfig() {
    return this.http.get<any>(`${environment.apiUrl}/client/config`);
  }
}
