import { Injectable } from '@angular/core';
import {MetaPage, Template} from '../../../domain/meta.page';
import {AttributeType, MetaEntity, VisibilityType} from '../../../domain/meta.entity';
import {Entity} from '../../../domain/entity';
import {AbstractControl, FormGroup, Validators} from '@angular/forms';
import {FormArrayWithAttribute, FormControlWithAttribute} from './form.service';

@Injectable({
  providedIn: 'root'
})
export class NewFormService {

  constructor() { }

  createFormGroup(mode: string,
                  metaEntityName: string,
                  metaPageMap: Map<string, MetaPage>,
                  metaEntityMap: Map<string, MetaEntity>,
                  entity: Entity | null,
  ) {
    const controls: {
      [key: string]: AbstractControl;
    } = {};

    const metaEntity = metaEntityMap.get(metaEntityName);
    if (!metaEntity) {
      throw new Error(`Unable to find template MetaEntity of ${metaEntityName}`);
    }

    // loop through all MetaAttributes and add FormControls for each attribute
    for (const nextAttribute of metaEntity.attributes) {
      let formControl: any;
      if (nextAttribute.type === AttributeType.OneToMany) {
        formControl = new FormArrayWithAttribute([]);

        const itemArray = entity ? (entity as any)[nextAttribute.name] as [] : null;
        let itemCount = itemArray ? itemArray.length : 0;
        if (itemArray && itemCount > 0) {
          //const attributeCell = this.findCellForAttribute(nextAttribute, template);
          //if(attributeCell) {
            //const childTemplate = attributeCell.template;
            //if (childTemplate) {
              const childMetaEntityName = nextAttribute.relationshipTarget;
              for (let i = 0; i < itemCount; i++) {
                const childEntity = itemArray[i];
                formControl.push(this.createFormGroup(mode, childMetaEntityName, metaPageMap, metaEntityMap, childEntity))
              }
            //}
          //}
        }
      }
      else if(nextAttribute.type == AttributeType.OneToPoly) {
        formControl = new FormArrayWithAttribute([]);

        if(true) {
          throw new Error('TODO');
        }

        // TODO: more here iterating through the children and creating their Form Controls
        // const itemArray = entity ? (entity as any)[nextAttribute.name] as [] : null;
        // let itemCount = itemArray ? itemArray.length : 0;
        // if (itemArray && itemCount > 0) {
        //   for (let i = 0; i < itemCount; i++) {
        //     const childEntity = itemArray[i];
        //     const discriminator = nextAttribute.discriminator;
        //     const childDiscriminatorValue = childEntity[discriminator.discriminatorName];
        //     const childEntityMapping = discriminator.entityMappingList.find(a => a.discriminatorValue === childDiscriminatorValue);
        //     if(childEntityMapping) {
        //       const childPageName = childEntityMapping.metaEntityName + ".view_edit"
        //       const childPage = metaPageMap.get(childPageName);
        //       if(childPage) {
        //         const childTemplate = childPage.templates[0];
        //         console.log(`Adding formGroup for; ${nextAttribute.name}, ${childDiscriminatorValue}, ${childPageName}`);
        //         formControl.push(this.createFormGroup(mode, childTemplate, metaPageMap, metaEntityMap, childEntity))
        //       }
        //     }
        //   }
        // }
      }
      else if (nextAttribute.type === AttributeType.OneToOne) {
        // Remember: if the OneToOne is not showing up in the FormGroup is it because the template has no cell/attribute for it (attributeCell is null)
        // const attributeCell = this.findCellForAttribute(nextAttribute, template);
        // if(attributeCell) {
        //   const childTemplate = attributeCell.template;
        //   if (childTemplate) {
        //     const childEntity = entity ? (entity as any)[nextAttribute.name] : null;
        //     formControl = this.createFormGroup(mode, childTemplate, metaPageMap, metaEntityMap, childEntity);
        //   }
        // }

        const childMetaEntityName = nextAttribute.relationshipTarget;
        const childEntity = entity ? (entity as any)[nextAttribute.name] : null;
        formControl = this.createFormGroup(mode, childMetaEntityName, metaPageMap, metaEntityMap, childEntity);

      }
      else if (nextAttribute.type === AttributeType.Date) {
        // See WARNING below: Date does need to be null, otherwise empty string is treated as an invalid Date and prevents
        // "no value" optional dates from allowing the form validation to be valid
        formControl = new FormControlWithAttribute({value: null, disabled: mode === 'view'});
      }
      else {
        // WARNING: This has been a bit of a cockroach problem. One of these two lines is "correct" but depending on
        // the low level sequence of processing elsewhere the "right" answer is either '' or null. If you change this
        // line you'll probably get subtle bugs elsewhere. Ideally I'd like it to be null but Angular and JS seem to
        // prefer ''. Don't even get me started on undefined.
        //formControl = new FormControlWithAttribute({value: null, disabled: mode === 'view'});
        formControl = new FormControlWithAttribute({value: '', disabled: mode === 'view'});
      }

      if(formControl) {
        if(nextAttribute.visibility === VisibilityType.Required) {
          formControl.addValidators(Validators.required);
        }

        formControl.attribute = nextAttribute;
        controls[nextAttribute.name] = formControl;
      }
    }

    return new FormGroup(controls);
  }
}
