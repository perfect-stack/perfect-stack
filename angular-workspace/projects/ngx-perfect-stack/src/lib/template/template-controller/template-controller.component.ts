import {Component, Input, OnInit} from '@angular/core';
import {Template} from '../../domain/meta.page';
import {MetaEntity} from '../../domain/meta.entity';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-template-controller',
  templateUrl: './template-controller.component.html',
  styleUrls: ['./template-controller.component.css']
})
export class TemplateControllerComponent implements OnInit { //, OnChanges {

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
