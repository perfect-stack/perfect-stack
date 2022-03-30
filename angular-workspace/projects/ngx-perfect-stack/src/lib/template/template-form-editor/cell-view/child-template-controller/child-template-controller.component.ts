import {Component, Input, OnInit} from '@angular/core';
import {Template} from '../../../../domain/meta.page';
import {Observable} from 'rxjs';
import {MetaEntity} from '../../../../domain/meta.entity';
import {MetaEntityService} from '../../../../meta/entity/meta-entity-service/meta-entity.service';

@Component({
  selector: 'lib-child-template-controller',
  templateUrl: './child-template-controller.component.html',
  styleUrls: ['./child-template-controller.component.css']
})
export class ChildTemplateControllerComponent implements OnInit {

  @Input()
  public template: Template;

  public metaEntityOptions$: Observable<MetaEntity[]>;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.metaEntityOptions$ = this.metaEntityService.findAll();
  }

  getMetaEntity(template: Template, metaEntityOptions: MetaEntity[]) {
    return metaEntityOptions.find(me => me.name === template.metaEntityName);
  }

}
