import { Component, OnInit } from '@angular/core';
import {Observable, switchMap} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {MetaAttribute, MetaEntity} from '../../domain/meta.entity';
import {Entity} from '../../domain/entity';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';

@Component({
  selector: 'app-data-view',
  templateUrl: './data-view.component.html',
  styleUrls: ['./data-view.component.css']
})
export class DataViewComponent implements OnInit {

  public metaName: string | null;
  public metaEntity$: Observable<MetaEntity>;

  public entityId: string | null;
  public entity$: Observable<Entity>;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService) {
  }

  ngOnInit(): void {
    this.metaEntity$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName')
      return this.metaEntityService.findById(this.metaName);
    }));

    this.entity$ = this.route.paramMap.pipe(switchMap(params => {
      const metaName = params.get('metaName')
      this.entityId = params.get('id');
      return this.dataService.findById(metaName, this.entityId)
    }));
  }

  // TODO: needs to be a common function (possibly a pipe)
  displayValue(metaAttribute: MetaAttribute, item: any) {
    if(Object.keys(item).includes(metaAttribute.name)) {
      return item[metaAttribute.name];
    }
    else {
      return `Unknown attribute name of ${metaAttribute.name}`
    }
  }

  onEdit() {
    this.router.navigate([`/data/${this.metaName}/edit/`, this.entityId]);
  }

  onCancel() {
    this.router.navigate([`/data/${this.metaName}/search`]);
  }

}
