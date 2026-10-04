import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MetaRoleService } from '../meta-role-service/meta-role.service';
import { MetaRole } from '../../../domain/meta.role';
import { ClientConfigService } from '../../../client/config/client-config.service';

@Component({
    selector: 'lib-meta-role-search',
    templateUrl: './meta-role-search.component.html',
    styleUrls: ['./meta-role-search.component.css'],
    standalone: false
})
export class MetaRoleSearchComponent implements OnInit {

  public searchResults: MetaRole[] = [];
  public isMetaEditEnabled$: Observable<boolean>;

  constructor(
    protected readonly router: Router,
    protected readonly metaRoleService: MetaRoleService,
    protected readonly clientConfigService: ClientConfigService,
    protected readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.isMetaEditEnabled$ = this.clientConfigService.isMetaEditEnabled('Role');
    this.onSearch();
  }

  onSearch() {
    this.metaRoleService.findAll().subscribe( response => {
      this.searchResults = response;
      this.cdr.markForCheck();
    });
  }

  onNew() {
    this.router.navigate(['/meta/role/edit/**NEW**'])
  }

  onSelect(item: MetaRole) {
    this.router.navigate(['/meta/role/edit', item.name]);
  }

}
