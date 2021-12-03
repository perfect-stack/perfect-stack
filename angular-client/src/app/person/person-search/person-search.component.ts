import { Component, OnInit } from '@angular/core';
import {Person} from '../../domain/person';
import {PersonService} from '../person-service/person.service';
import {PersonSearchCriteria} from './person-search-criteria';

@Component({
  selector: 'app-person-search',
  templateUrl: './person-search.component.html',
  styleUrls: ['./person-search.component.css']
})
export class PersonSearchComponent implements OnInit {

  public searchCriteria = new PersonSearchCriteria();
  public pageNumber = 1;
  public pageSize = 50;
  public collectionSize = 0;
  public searchResults: Person[] = [];

  constructor(protected readonly personService: PersonService) { }

  ngOnInit(): void {
    this.onSearch();
  }

  onSearch() {
    this.personService.findByCriteria(this.searchCriteria.nameCriteria, this.pageNumber, this.pageSize).subscribe( response => {
      this.searchResults = response.resultList;
      this.collectionSize = response.totalCount;
    });
  }

}
