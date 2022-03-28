import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Template, TemplateType} from '../../domain/meta.page';
import {MetaEntity} from '../../domain/meta.entity';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {Observable} from 'rxjs';
import {ModalDismissReasons, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {TemplateOptionsModalComponent} from './template-options-modal/template-options-modal.component';

@Component({
  selector: 'app-template-controller',
  templateUrl: './template-controller.component.html',
  styleUrls: ['./template-controller.component.css']
})
export class TemplateControllerComponent implements OnInit, OnChanges {

  @Input()
  public template: Template;

  closeResult = '';

  public metaEntityOptions$: Observable<MetaEntity[]>;
  metaEntity: MetaEntity;

  constructor(protected readonly metaEntityService: MetaEntityService,
              protected readonly modalService: NgbModal) { }

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

  openTemplateOptions() {
    const modalRef = this.modalService.open(TemplateOptionsModalComponent, {});
    modalRef.componentInstance.assignTemplate(this.template);
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

}
