import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExpressionService {

  constructor() { }

  updateOrView(mode: string, params: any[]): string {
    return mode === 'view' ? params.join(' ') : 'Update ' + params.join(' ');
  }
}
