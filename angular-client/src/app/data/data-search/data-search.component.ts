import { Component, OnInit } from '@angular/core';
import {Observable, switchMap, tap} from 'rxjs';
import {MetaAttribute, MetaEntity} from '../../domain/meta.entity';
import {ActivatedRoute, Router} from '@angular/router';
import {PersonSearchCriteria} from '../../person/person-search/person-search-criteria';
import {DataService} from '../data-service/data.service';
import {Entity} from '../../domain/entity';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {MetaPage} from '../../domain/meta.page';
import {CellAttribute, MetaPageService} from '../../meta/page/meta-page-service/meta-page.service';

@Component({
  selector: 'app-data-search',
  templateUrl: './data-search.component.html',
  styleUrls: ['./data-search.component.css']
})
export class DataSearchComponent implements OnInit {

  public metaName: string | null;
  public mode: string | null;

  public metaPage$: Observable<MetaPage>;
  public metaEntity$: Observable<MetaEntity>;

  criteriaFormCells: CellAttribute[][];
  resultTableCells: CellAttribute[][];

  public searchCriteria = new PersonSearchCriteria();
  public pageNumber = 1;
  public pageSize = 50;
  public collectionSize = 0;
  public searchResults: Entity[] = [];


  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaPageService: MetaPageService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.metaPage$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      this.mode = 'search';
      const metaPageName = `${this.metaName}.${this.mode}`;
      return this.metaPageService.findById(metaPageName).pipe(tap(metaPage => {
        this.metaEntity$ = this.route.paramMap.pipe(switchMap(params => {
          this.metaName = params.get('metaName');
          return this.metaEntityService.findById(this.metaName).pipe(tap(metaEntity => {

            const criteriaTemplate = metaPage.templates[0];
            this.criteriaFormCells = this.metaPageService.toCellAttributeArray(criteriaTemplate, metaEntity);

            const resultTableTemplate = metaPage.templates[1];
            this.resultTableCells = this.metaPageService.toCellAttributeArray(resultTableTemplate, metaEntity);

            this.onSearch();
          }));
        }));
      }));
    }));
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
