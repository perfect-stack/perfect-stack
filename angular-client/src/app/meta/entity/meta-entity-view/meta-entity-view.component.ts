import { Component, OnInit } from '@angular/core';
import {Observable, switchMap} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {MetaEntity} from '../../../domain/meta.entity';
import {MetaEntityService} from '../meta-entity-service/meta-entity.service';

@Component({
  selector: 'app-meta-entity-view',
  templateUrl: './meta-entity-view.component.html',
  styleUrls: ['./meta-entity-view.component.css']
})
export class MetaEntityViewComponent implements OnInit {

  public metaName: string | null;
  public metaEntity$: Observable<MetaEntity>;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaEntityService: MetaEntityService) {
  }

  ngOnInit(): void {
    this.metaEntity$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      return this.metaEntityService.findById(this.metaName);
    }));
  }

  onEdit() {
    this.router.navigate(['/meta/entity/edit/', this.metaName]);
  }

  onBack() {
    this.router.navigate(['meta/entity/search']);
  }

}
