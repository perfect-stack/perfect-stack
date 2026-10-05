import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Cell, MetaPage, Template } from '../../../domain/meta.page';
import { MetaEntity } from '../../../domain/meta.entity';
import { MetaEntityService } from '../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../../meta/page/meta-page-service/meta-page.service';
import { DiscriminatorMapping, DiscriminatorService } from '../../data-service/discriminator.service';
import { FormArrayWithAttribute, FormContext } from '../../data-edit/form-service/form.service';
import { FormGroupService } from '../../data-edit/form-service/form-group.service';
import { CardItemDialogComponent } from './controls/card-item-dialog/card-item-dialog.component';

@Component({
  selector: 'lib-card-layout',
  templateUrl: './card-layout.component.html',
  styleUrls: ['./card-layout.component.css'],
  standalone: false
})
export class CardLayoutComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: Cell;

  @Input()
  ctx: FormContext;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  relationshipProperty: string;

  metaEntityMap$: Observable<Map<string, MetaEntity>>;
  metaPageMap$: Observable<Map<string, MetaPage>>;
  discriminatorMap$: Observable<Map<string, Map<string, DiscriminatorMapping>>>;

  constructor(private modalService: NgbModal,
              private metaEntityService: MetaEntityService,
              private metaPageService: MetaPageService,
              private discriminatorService: DiscriminatorService,
              private fb: UntypedFormBuilder,
              private formGroupService: FormGroupService) {}

  ngOnInit(): void {
    console.log('CardLayout: ngOnInit(): formGroup', this.formGroup);
    console.log('CardLayout: ngOnInit(): relationshipProperty', this.relationshipProperty);

    this.metaEntityMap$ = this.metaEntityService.metaEntityMap$;
    this.metaPageMap$ = this.metaPageService.metaPageMap$;
    this.discriminatorMap$ = this.discriminatorService.discriminatorMap$;
  }

  get attributes() {
    return this.formGroup.get(this.relationshipProperty) as FormArrayWithAttribute;
  }

  get attributeDiscriminator() {
    const attribute = this.attributes.attribute;
    if(attribute) {
      const discriminator = attribute.discriminator;
      if (discriminator) {
        return discriminator;
      }
      else {
        throw new Error(`No discriminator defined for attribute ${attribute.name}`);
      }
    }
    else {
      throw new Error(`No attribute found`);
    }
  }

  getFormGroupForRow(rowIdx: number) {
    return this.attributes.at(rowIdx) as UntypedFormGroup;
  }

  getCardItem(rowIdx: number, discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>) {
    const attribute = this.attributes.attribute;
    if(attribute) {
      const discriminator = attribute.discriminator;
      if(discriminator) {
        const formGroup = this.getFormGroupForRow(rowIdx);
        if(formGroup) {
          const discriminatorControl = formGroup.controls[discriminator.discriminatorName + '_id'];
          if(discriminatorControl) {
            const discriminatorValue = discriminatorControl.value;
            if (discriminatorValue) {
              const discriminator = discriminatorMap.get(attribute.name);
              if(discriminator) {
                const discriminatorMapping = discriminator.get(discriminatorValue);
                if(discriminatorMapping) {
                  return {
                    discriminatorId: discriminatorMapping.discriminatorId,
                    discriminatorValue: discriminatorValue,
                    metaEntityName: discriminatorMapping.metaEntityName,
                    metaPageName: discriminatorMapping.metaPageName
                  };
                }
                else {
                  throw new Error(`Unable to find discriminatorMapping for rowIdx ${rowIdx}, discriminatorValue = ${JSON.stringify(discriminatorValue)}`);
                }
              }
              else {
                throw new Error(`Unable to find discriminatorMap for ${attribute.name}`);
              }
            }
            else {
              throw new Error(`Unable to find discriminatorValue for ${attribute.discriminator.discriminatorName}`);
            }
          }
          else {
            throw new Error(`Unable to find discriminatorControl for ${attribute.discriminator.discriminatorName}`);
          }
        }
        else {
          throw new Error(`Unable to find formGroup for rowIdx ${rowIdx}`);
        }
      }
      else {
        throw new Error(`No discriminator defined for attribute ${attribute.name}`);
      }
    }
    else {
      throw new Error(`No attribute found for rowIdx ${rowIdx}`);
    }
  }

  getMetaPageForRow(rowIdx: number,
                    metaPageMap: Map<string, MetaPage>,
                    discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>): MetaPage {
    const cardItem = this.getCardItem(rowIdx, discriminatorMap);
    const metaPage = metaPageMap.get(cardItem.metaPageName);
    if(metaPage) {
      return metaPage;
    }
    else {
      throw new Error(`Unable to find MetaPage for rowIdx ${rowIdx}`);
    }
  }

  getHeadingForRow(rowIdx: number,
                   metaPageMap: Map<string, MetaPage>,
                   discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>): string {
    return this.getMetaPageForRow(rowIdx, metaPageMap, discriminatorMap)?.title;
  }

  getTemplateForRow(rowIdx: number,
                    metaPageMap: Map<string, MetaPage>,
                    discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>): Template {
    return this.getMetaPageForRow(rowIdx, metaPageMap, discriminatorMap).templates[0];
  }

  onAddItem(metaPageMap: Map<string, MetaPage>,
            metaEntityMap: Map<string, MetaEntity>,
            discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>) {
    if(this.mode === 'edit') {

      const disabledList: string[] = [];
      for(const formGroupRow of this.attributes.controls) {
        if(formGroupRow instanceof UntypedFormGroup) {
          disabledList.push(formGroupRow.controls['activity_type_id'].value);
        }
      }

      console.log(`Dialog should disable the following list: ${disabledList}`);

      const modalRef = this.modalService.open(CardItemDialogComponent);
      const cardItemDialog = modalRef.componentInstance as CardItemDialogComponent;
      cardItemDialog.metaAttribute = this.attributes.attribute;
      cardItemDialog.disabledList = disabledList;

      const self = this;
      modalRef.closed.subscribe((cardItems) => {
        console.log(`Adding card items; ${cardItems}`);
        if(cardItems) {
          for(const nextItemName of cardItems) {
            this.addOneItem(self.mode, nextItemName, metaPageMap, metaEntityMap, discriminatorMap);
          }
        }
      });
    }
  }

  addOneItem(mode: string | null,
             discriminatorValue: string,
             metaPageMap: Map<string, MetaPage>,
             metaEntityMap: Map<string, MetaEntity>,
             discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>) {

    const cardItemList = [];
    const attributeDiscriminator = this.attributeDiscriminator;
    const discriminator = discriminatorMap.get(this.relationshipProperty);
    if(discriminator) {
      for(const nextMapping of attributeDiscriminator.entityMappingList) {
        if(nextMapping.discriminatorValue == discriminatorValue) {
          cardItemList.push(discriminator.get(nextMapping.discriminatorValue));
        }
      }
    }
    else {
      throw new Error(`Unable to find discriminator for ${this.relationshipProperty}`);
    }

    if(cardItemList.length === 0 || cardItemList.length > 1) {
      throw new Error(`Unable to find cardItem for discriminatorValue ${discriminatorValue}`);
    }

    const cardItem = cardItemList[0];
    if(cardItem && cardItem.metaPageName) {
      const metaPage = metaPageMap.get(cardItem.metaPageName);
      if(metaPage && metaPage.templates.length > 0) {
        const template = metaPage.templates[0];

        if(mode) {
          const itemFormGroup = this.formGroupService.createFormGroup(mode, template.metaEntityName, metaPageMap, metaEntityMap, null);
          itemFormGroup.addControl('activity_type_id', this.fb.control(''));

          const discriminatorId = cardItem.discriminatorId;

          const item: any = {
            activity_type_id: discriminatorId,
          };

          itemFormGroup.patchValue(item);
          this.attributes.push(itemFormGroup);
          console.log('Created formGroup and added new item successfully.');
          console.log(' - ctx:', this.ctx);
          console.log(' - item:', item);
          console.log(' - itemFormGroup:', itemFormGroup);
        }
      }
    }
  }

  onDeleteItem(rowIdx: number) {
    this.attributes.removeAt(rowIdx);
  }

  getNoItemsHtml() {
    return this.cell.noItemsHtml ? this.cell.noItemsHtml : 'No items';
  }
}
