import { Component, OnInit } from '@angular/core';
import {Observable, switchMap} from 'rxjs';
import {MetaAttribute, MetaEntity} from '../../domain/meta.entity';
import {ActivatedRoute, Router} from '@angular/router';
import {MetaService} from '../../meta/service/meta.service';
import {PersonSearchCriteria} from '../../person/person-search/person-search-criteria';
import {DataService} from '../service/data.service';
import {Entity} from '../../domain/entity';

@Component({
  selector: 'app-data-search',
  templateUrl: './data-search.component.html',
  styleUrls: ['./data-search.component.css']
})
export class DataSearchComponent implements OnInit {

  public metaName: string | null;
  public metaEntity$: Observable<MetaEntity>;

  public searchCriteria = new PersonSearchCriteria();
  public pageNumber = 1;
  public pageSize = 50;
  public collectionSize = 0;
  public searchResults: Entity[] = [];


  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaService: MetaService,
              protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.metaEntity$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      return this.metaService.findOne(this.metaName);
    }));

    this.metaEntity$.subscribe((metaEntity) => {
      this.onSearch();
    })
  }


  onSearch() {
    if(this.metaName) {
      this.dataService.findByCriteria(this.metaName, this.searchCriteria.nameCriteria, this.pageNumber, this.pageSize).subscribe( response => {
        this.searchResults = response.resultList;
        this.collectionSize = response.totalCount;
      });
    }
  }

  displayValue(metaAttribute: MetaAttribute, item: any) {
    if(Object.keys(item).includes(metaAttribute.name)) {
      return item[metaAttribute.name];
    }
    else {
      return `Unknown attribute name of ${metaAttribute.name}`
    }
  }

  onSelectRow(id: string) {
    this.router.navigate([`/data/${this.metaName}/view/${id}`]);
  }
}
