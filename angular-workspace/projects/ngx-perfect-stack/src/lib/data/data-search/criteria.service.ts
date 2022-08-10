import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CriteriaService {

  private searchStateMap = new Map<string, SearchState>();

  constructor() { }

  getSearchState(name: string): SearchState {
    let searchState = this.searchStateMap.get(name);
    if(!searchState) {
      searchState = {
        criteria: {},
        pageNumber: 1,
      };
      this.searchStateMap.set(name, searchState);
    }

    return searchState;
  }

  updateSearchState(name: string, criteria: any, pageNumber: number) {
    this.searchStateMap.set(name, {
      criteria: criteria,
      pageNumber: pageNumber
    });
  }
}

export class SearchState {
  criteria: any;
  pageNumber: number;
}
