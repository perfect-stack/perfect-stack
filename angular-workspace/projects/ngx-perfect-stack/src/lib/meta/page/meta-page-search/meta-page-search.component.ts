import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {MetaPage} from '../../../domain/meta.page';
import {MetaPageService} from '../meta-page-service/meta-page.service';

@Component({
  selector: 'app-meta-page-search',
  templateUrl: './meta-page-search.component.html',
  styleUrls: ['./meta-page-search.component.css']
})
export class MetaPageSearchComponent implements OnInit {

  public searchResults: MetaPage[] = [];

  constructor(
    protected readonly router: Router,
    protected readonly metaPageService: MetaPageService) { }

  ngOnInit(): void {
    this.onSearch();
  }

  onSearch() {
    this.metaPageService.findAll().subscribe( response => {
      this.searchResults = response;
    });
  }

  onNew() {
    this.router.navigate(['/meta/page/edit/**NEW**'])
  }

  onSelect(item: MetaPage) {
    this.router.navigate(['/meta/page/edit', item.name]);
  }
}
