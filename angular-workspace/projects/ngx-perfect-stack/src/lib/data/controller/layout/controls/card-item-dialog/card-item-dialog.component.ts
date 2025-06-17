import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {UntypedFormBuilder} from '@angular/forms';
import {ButtonDefinition} from '../../../../../utils/tile-button-panel/tile-button-panel.component';
import {MetaEntityService} from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import {DiscriminatorService} from "../../../../data-service/discriminator.service";

@Component({
    selector: 'lib-card-item-dialog',
    templateUrl: './card-item-dialog.component.html',
    styleUrls: ['./card-item-dialog.component.css'],
    standalone: false
})
export class CardItemDialogComponent implements OnInit {


  // Set by the calling component via modalRef.instance
  public metaAttribute: MetaAttribute;

  // Set by the calling component via modalRef.instance
  public disabledList: string[] = [];

  buttonList: ButtonDefinition[] = [];
  itemsSelected: string[] | null = null;

  constructor(protected readonly fb: UntypedFormBuilder,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly discriminatorService: DiscriminatorService,
              public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
    this.metaEntityService.metaEntityMap$.subscribe((metaEntityMap) => {
      this.discriminatorService.discriminatorMap$.subscribe((discriminatorMap) => {
        if(this.metaAttribute) {
          const discriminatorMapping = discriminatorMap.get(this.metaAttribute.name);

          console.log('Check disabled: ', discriminatorMapping, this.disabledList);
          if(discriminatorMapping) {
            for(const entityMapping of this.metaAttribute.discriminator.entityMappingList) {
              const metaEntity = metaEntityMap.get(entityMapping.metaEntityName);
              const discriminatorItem = discriminatorMapping.get(entityMapping.discriminatorValue);
              console.log(' - discriminatorItem: ', discriminatorItem);

              if(discriminatorItem) {
                this.buttonList.push({
                  name: entityMapping.discriminatorValue,
                  icon: metaEntity ? metaEntity.icon : 'error',
                  //enabled: this.disabledList.indexOf(entityMapping.discriminatorValue) < 0
                  enabled: this.disabledList.indexOf(discriminatorItem.discriminatorId) < 0
                });
              }
            }
          }
        }
      });
    });
  }

  onButtonClicked(itemsSelected: string[]) {
    this.itemsSelected = itemsSelected;
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  onAdd() {
    console.log(`Add these cards now: ${this.itemsSelected}`);
    this.activeModal.close(this.itemsSelected);
  }

  isAddEnabled() {
    return this.itemsSelected !== null && this.itemsSelected.length > 0;
  }
}
