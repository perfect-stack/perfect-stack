import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Template, TemplateType} from '../../domain/meta.page';
import {MetaEntity} from '../../domain/meta.entity';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-template-controller',
  templateUrl: './template-controller.component.html',
  styleUrls: ['./template-controller.component.css']
})
export class TemplateControllerComponent implements OnInit, OnChanges {

  @Input()
  public template: Template;

  public metaEntityOptions$: Observable<MetaEntity[]>;

  metaEntity: MetaEntity;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.metaEntityOptions$ = this.metaEntityService.findAll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['template']) {
      this.onTemplateChange(changes['template'].currentValue);
    }
  }

  onTemplateChange(template: Template) {
    if(template && template.metaEntityName) {
      this.metaEntityService.findById(template.metaEntityName).subscribe(metaEntity => this.metaEntity = metaEntity);
    }
  }

  getTemplateTypeOptions() {
    return Object.keys(TemplateType);
  }

  onEntityChange(metaEntity: MetaEntity) {
    this.metaEntity = metaEntity;
    this.template.metaEntityName = metaEntity.name;
  }

  getMetaEntity(template: Template, metaEntityOptions: MetaEntity[]) {
    return metaEntityOptions.find(me => me.name === template.metaEntityName);
  }

  getOrderByNameOptions() {
    return this.metaEntity ? this.metaEntity.attributes.map(a => a.name) : [];
  }

  getOrderByDirOptions() {
    return ['ASC', "DESC"];
  }
}
