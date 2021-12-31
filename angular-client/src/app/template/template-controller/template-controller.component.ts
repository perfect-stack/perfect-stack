import {Component, Input, OnInit} from '@angular/core';
import {Template, TemplateType} from '../../domain/meta.page';
import {Observable, tap} from 'rxjs';
import {MetaEntity} from '../../domain/meta.entity';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';

@Component({
  selector: 'app-template-controller',
  templateUrl: './template-controller.component.html',
  styleUrls: ['./template-controller.component.css']
})
export class TemplateControllerComponent implements OnInit {

  @Input()
  template: Template;

  public metaEntityOptions$: Observable<MetaEntity[]>;

  public metaEntity: MetaEntity;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.metaEntityOptions$ = this.metaEntityService.findAll().pipe(tap(metaEntityOptions => {
      if(this.template) {
        const me = metaEntityOptions.find(me => me.name = this.template.metaEntityName);
        if(me) {
          this.metaEntity = me;
        }
      }
    }));
  }

  getTemplateTypeOptions() {
    return Object.keys(TemplateType);
  }

  onEntityChange(metaEntity: MetaEntity) {
    console.log(`TODO: onEntityChange(): ${metaEntity.name}`)
    this.template.metaEntityName = metaEntity.name;
    this.metaEntity = metaEntity;
  }
}
