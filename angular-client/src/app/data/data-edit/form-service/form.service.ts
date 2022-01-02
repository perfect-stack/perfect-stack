import { Injectable } from '@angular/core';
import {CellAttribute, MetaPageService} from '../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {DataService} from '../../data-service/data.service';
import {Entity} from '../../../domain/entity';
import {MetaPage} from '../../../domain/meta.page';
import {FormGroup} from '@angular/forms';
import {forkJoin, of, switchMap} from 'rxjs';
import {MetaEntity} from '../../../domain/meta.entity';


export class FormContext {
  metaPage: MetaPage;
  metaEntity: MetaEntity;
  entity: Entity;

  cells: CellAttribute[][];
  entityForm: FormGroup;
}

@Injectable({
  providedIn: 'root'
})
export class FormService {

  constructor(protected readonly metaPageService: MetaPageService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService) { }

  loadFormContext(metaName: string, mode: string, id: string) {
    const metaPageName = `${metaName}.${mode}`;
    const obs = [
      this.metaPageService.findById(metaPageName),
      this.metaEntityService.findById(metaName),
      this.dataService.findById(metaName, id),
    ];

    return forkJoin(obs).pipe(switchMap(([metaPage, metaEntity, entity]) => {
      const ctx = new FormContext();
      ctx.metaPage = metaPage as MetaPage;
      ctx.metaEntity = metaEntity as MetaEntity;
      ctx.entity = entity as Entity;

      const template = ctx.metaPage.templates[0];
      ctx.cells = this.metaPageService.toCellAttributeArray(template, ctx.metaEntity);
      //ctx.entityForm =

      return of(ctx);
    }));
  }
}
