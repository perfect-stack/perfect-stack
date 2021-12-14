import { Component, OnInit } from '@angular/core';
import {MetaEntity} from '../../../domain/meta.entity';
import {MetaEntityService} from '../meta-entity-service/meta-entity.service';

@Component({
  selector: 'app-meta-entity-search',
  templateUrl: './meta-entity-search.component.html',
  styleUrls: ['./meta-entity-search.component.css']
})
export class MetaEntitySearchComponent implements OnInit {

  public searchResults: MetaEntity[] = [];

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.onSearch();
  }

  onSearch() {
    this.metaEntityService.findAll().subscribe( response => {
      this.searchResults = response;
    });
  }

}
