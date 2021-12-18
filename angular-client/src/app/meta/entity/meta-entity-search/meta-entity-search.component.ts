import { Component, OnInit } from '@angular/core';
import {MetaEntity} from '../../../domain/meta.entity';
import {MetaEntityService} from '../meta-entity-service/meta-entity.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-meta-entity-search',
  templateUrl: './meta-entity-search.component.html',
  styleUrls: ['./meta-entity-search.component.css']
})
export class MetaEntitySearchComponent implements OnInit {

  public searchResults: MetaEntity[] = [];

  constructor(
    protected readonly router: Router,
    protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.onSearch();
  }

  onSearch() {
    this.metaEntityService.findAll().subscribe( response => {
      this.searchResults = response;
    });
  }

  onNew() {
    this.router.navigate(['/meta/entity/edit/**NEW**'])
  }

  onSelect(item: MetaEntity) {
    this.router.navigate(['/meta/entity/view', item.name]);
  }
}
