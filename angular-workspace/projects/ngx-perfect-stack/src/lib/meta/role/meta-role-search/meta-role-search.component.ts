import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {MetaRoleService} from '../meta-role-service/meta-role.service';
import {MetaRole} from '../../../domain/meta.role';

@Component({
  selector: 'lib-meta-role-search',
  templateUrl: './meta-role-search.component.html',
  styleUrls: ['./meta-role-search.component.css']
})
export class MetaRoleSearchComponent implements OnInit {

  public searchResults: MetaRole[] = [];

  constructor(
    protected readonly router: Router,
    protected readonly metaRoleService: MetaRoleService) { }

  ngOnInit(): void {
    this.onSearch();
  }

  onSearch() {
    this.metaRoleService.findAll().subscribe( response => {
      this.searchResults = response;
    });
  }

  onNew() {
    this.router.navigate(['/meta/role/edit/**NEW**'])
  }

  onSelect(item: MetaRole) {
    this.router.navigate(['/meta/role/edit', item.name]);
  }

}
