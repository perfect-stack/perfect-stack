import {Component, Input, OnInit} from '@angular/core';
import {Template} from '../../../domain/meta.page';
import {TemplateOptionsModalComponent} from './template-options-modal/template-options-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MetaEntity} from '../../../domain/meta.entity';
import {AttributePaletteService} from '../../attribute-palette/attribute-palette.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {PropertySheetService} from '../../property-sheet/property-sheet.service';

@Component({
  selector: 'lib-template-options-panel',
  templateUrl: './template-options-panel.component.html',
  styleUrls: ['./template-options-panel.component.css']
})
export class TemplateOptionsPanelComponent implements OnInit {

  @Input()
  template: Template;


  metaEntityMap$ = this.metaEntityService.metaEntityMap$;
  selected = false;

  constructor(protected readonly modalService: NgbModal,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly propertySheetService: PropertySheetService,
              protected readonly attributePaletteService: AttributePaletteService) { }

  ngOnInit(): void {
  }

  openTemplateOptions() {
    const modalRef = this.modalService.open(TemplateOptionsModalComponent, {});
    modalRef.componentInstance.assignTemplate(this.template);
  }

  onClick(metaEntityMap: Map<string, MetaEntity>, $event: Event) {
    if(!this.selected) {
      this.selected = true;
      const metaEntity = metaEntityMap.get(this.template.metaEntityName);
      if(metaEntity) {
        this.attributePaletteService.metaEntity$.next(metaEntity);
        TemplateOptionsPanelComponent.switchSelected(this);
      }

      this.propertySheetService.editWithType('Template', this.template, 'Template');
    }
  }

  disableSelected() {
    this.selected = false;
  }

  static lastTemplateOptionsPanelComponent: TemplateOptionsPanelComponent;

  /**
   * The purpose of this method and the related static field is so that the "selected" focus is only enabled
   * for one component at a time. When the next component needs focus this method will remove/disable the selection
   * from the previous component.
   */
  static switchSelected(nextTemplateOptionsPanelComponent: TemplateOptionsPanelComponent) {
    if(TemplateOptionsPanelComponent.lastTemplateOptionsPanelComponent) {
      TemplateOptionsPanelComponent.lastTemplateOptionsPanelComponent.disableSelected();
    }
    TemplateOptionsPanelComponent.lastTemplateOptionsPanelComponent = nextTemplateOptionsPanelComponent;
  }
}
