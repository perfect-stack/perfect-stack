import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class ActivityTemplateService {
  private readonly templateMap = new Map<string, any>();
  private loaded = false;

  constructor(private readonly dataService: DataService) {}

  getActivityTemplate(id: string): Observable<any> {
    if (this.templateMap.has(id)) {
      return of(this.templateMap.get(id));
    }
    return this.dataService.findById('ActivityTemplate', id).pipe(
      tap(template => {
        if (template && template.id) {
          this.templateMap.set(template.id, template);
        }
      })
    );
  }

  getSynchronous(id: string): any | undefined {
    return this.templateMap.get(id);
  }

  clearCache(): void {
    this.templateMap.clear();
    this.loaded = false;
  }
}
