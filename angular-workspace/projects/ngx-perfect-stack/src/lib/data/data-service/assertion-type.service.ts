import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, first, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { DataService } from './data.service';
import { AssertionType } from '../../domain/assertion';

@Injectable({
  providedIn: 'root'
})
export class AssertionTypeService {

  private readonly assertionTypeMap = new Map<string, AssertionType>();
  private assertionTypeList: AssertionType[] = [];
  private loadObservable$: Observable<AssertionType[]> | null = null;
  private loaded = false;

  constructor(protected readonly dataService: DataService) { }

  /**
   * Lazily loads and caches all AssertionType/Protocol records from the backend.
   * If already loaded, returns the cached list immediately.
   */
  loadAssertionTypes(): Observable<AssertionType[]> {
    if (this.loaded) {
      return of(this.assertionTypeList);
    }

    if (this.loadObservable$) {
      return this.loadObservable$;
    }

    this.loadObservable$ = this.dataService.metaEntityMap$.pipe(
      first(map => !!map),
      switchMap(metaEntityMap => {
        const entityName = metaEntityMap && metaEntityMap.has('Protocol') ? 'Protocol' : 'AssertionType';
        return this.dataService.findAll(entityName, '', 1, 500);
      }),
      map(response => {
        const list = (response && response.resultList ? (response.resultList as unknown as any[]) : []);
        return list.map(item => ({
          ...item,
          assertion_type_name: item.protocol_name || item.assertion_type_name,
          protocol_name: item.protocol_name || item.assertion_type_name,
        })) as AssertionType[];
      }),
      tap(types => {
        this.assertionTypeMap.clear();
        for (const type of types) {
          if (type.id) {
            this.assertionTypeMap.set(type.id, type);
          }
        }
        this.assertionTypeList = types;
        this.loaded = true;
        this.loadObservable$ = null;
      }),
      catchError(err => {
        this.loadObservable$ = null;
        throw err;
      }),
      shareReplay(1)
    );

    return this.loadObservable$;
  }

  /**
   * Synchronously gets an AssertionType by ID from the cache.
   */
  getAssertionType(id: string): AssertionType | undefined {
    return this.assertionTypeMap.get(id);
  }

  /**
   * Synchronously gets all cached AssertionTypes.
   */
  getAllAssertionTypes(): AssertionType[] {
    return this.assertionTypeList;
  }

  /**
   * Invalidate the cache (e.g. after editing or adding an AssertionType).
   */
  clearCache(): void {
    this.loaded = false;
    this.loadObservable$ = null;
    this.assertionTypeMap.clear();
    this.assertionTypeList = [];
  }
}
