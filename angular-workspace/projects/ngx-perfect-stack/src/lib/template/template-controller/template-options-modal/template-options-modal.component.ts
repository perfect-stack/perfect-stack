import {Component, OnInit} from '@angular/core';
import {Template, TemplateType} from '../../../domain/meta.page';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MetaEntity} from '../../../domain/meta.entity';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-template-options-modal',
  templateUrl: './template-options-modal.component.html',
  styleUrls: ['./template-options-modal.component.css']
})
export class TemplateOptionsModalComponent implements OnInit {

  template: Template;
  metaEntityOptions$: Observable<MetaEntity[]>;
  metaEntity: MetaEntity;

  constructor(protected readonly metaEntityService: MetaEntityService,
              public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
    this.metaEntityOptions$ = this.metaEntityService.findAll();
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

  /**
   * We need a "setter" method to trigger and initialise stuff because @Input() doesn't do anything with the Modal
   * component being used.
   */
  assignTemplate(template: Template) {
    this.template = template;
    if(template && template.metaEntityName) {
      this.metaEntityService.findById(template.metaEntityName).subscribe(metaEntity => this.metaEntity = metaEntity);
    }
  }
}
