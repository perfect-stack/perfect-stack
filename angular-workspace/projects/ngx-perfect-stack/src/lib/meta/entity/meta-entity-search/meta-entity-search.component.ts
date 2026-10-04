import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { MetaEntity } from '../../../domain/meta.entity';
import { MetaEntityService } from '../meta-entity-service/meta-entity.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../utils/toasts/toast.service';
import { ClientConfigService } from '../../../client/config/client-config.service';

@Component({
    selector: 'app-meta-entity-search',
    templateUrl: './meta-entity-search.component.html',
    styleUrls: ['./meta-entity-search.component.css'],
    standalone: false
})
export class MetaEntitySearchComponent implements OnInit {

  public searchResults: MetaEntity[] = [];
  public isMetaEditEnabled$: Observable<boolean>;

  constructor(
    protected readonly router: Router,
    public readonly toastService: ToastService,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly clientConfigService: ClientConfigService,
    protected readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.isMetaEditEnabled$ = this.clientConfigService.isMetaEditEnabled('Entity');
    this.onSearch();
  }

  onSearch() {
    this.metaEntityService.findAll().subscribe( response => {
      this.searchResults = response;
      this.cdr.markForCheck();
    });
  }

  onNew() {
    this.router.navigate(['/meta/entity/edit/**NEW**'])
  }

  onSelect(item: MetaEntity) {
    this.router.navigate(['/meta/entity/view', item.name]);
  }

  onUpdateSchema() {
    this.metaEntityService.sync().subscribe( () => {
      this.toastService.showSuccess('Database schema updated successfully');
    });
  }

  onCreateFakePeople() {
    this.metaEntityService.createFakePeople().subscribe(() => {
      this.toastService.showSuccess('Fake people created successfully');
    });
  }
}
