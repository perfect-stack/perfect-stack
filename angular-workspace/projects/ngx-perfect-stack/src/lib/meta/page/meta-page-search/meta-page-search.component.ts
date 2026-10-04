import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MetaPage } from '../../../domain/meta.page';
import { MetaPageService } from '../meta-page-service/meta-page.service';
import { ClientConfigService } from '../../../client/config/client-config.service';

@Component({
    selector: 'app-meta-page-search',
    templateUrl: './meta-page-search.component.html',
    styleUrls: ['./meta-page-search.component.css'],
    standalone: false
})
export class MetaPageSearchComponent implements OnInit {

  public searchResults: MetaPage[] = [];
  public isMetaEditEnabled$: Observable<boolean>;

  constructor(
    protected readonly router: Router,
    protected readonly metaPageService: MetaPageService,
    protected readonly clientConfigService: ClientConfigService,
    protected readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.isMetaEditEnabled$ = this.clientConfigService.isMetaEditEnabled('Page');
    this.onSearch();
  }

  onSearch() {
    this.metaPageService.findAll().subscribe( response => {
      this.searchResults = response;
      this.cdr.markForCheck();
    });
  }

  onNew() {
    this.router.navigate(['/meta/page/edit/**NEW**'])
  }

  onSelect(item: MetaPage) {
    this.router.navigate(['/meta/page/edit', item.name]);
  }
}
