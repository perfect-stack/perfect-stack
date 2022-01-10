import {Component, Input, OnInit} from '@angular/core';
import {Template, TemplateType} from '../../domain/meta.page';
import {MetaEntity} from '../../domain/meta.entity';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';

@Component({
  selector: 'app-template-controller',
  templateUrl: './template-controller.component.html',
  styleUrls: ['./template-controller.component.css']
})
export class TemplateControllerComponent implements OnInit {

  @Input()
  public template: Template;

  @Input()
  public metaEntityOptions: MetaEntity[];

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
  }

  getTemplateTypeOptions() {
    return Object.keys(TemplateType);
  }

  onEntityChange(metaEntity: MetaEntity) {
    console.log(`TODO: onEntityChange(): ${metaEntity.name}`)
    this.template.metaEntityName = metaEntity.name;
  }

  getMetaEntity(template: Template, metaEntityOptions: MetaEntity[]) {
    return metaEntityOptions.find(me => me.name === template.metaEntityName);
  }

}
