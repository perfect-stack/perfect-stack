import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClientConfigService {

  environment = {
    apiUrl: ''
  }

  constructor(
    //@Inject('environment')
    //protected readonly environment: any,
    protected readonly http: HttpClient) { }

  getConfig() {
    return this.http.get<any>(`${this.environment.apiUrl}/client/config`);
  }
}
