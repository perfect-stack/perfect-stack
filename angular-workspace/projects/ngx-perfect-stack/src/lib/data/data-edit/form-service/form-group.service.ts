import { Injectable } from '@angular/core';
import {MetaPage} from '../../../domain/meta.page';
import {AttributeType, MetaAttribute, MetaEntity, VisibilityType} from '../../../domain/meta.entity';
import {Entity} from '../../../domain/entity';
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {FormArrayWithAttribute, FormControlWithAttribute} from './form.service';

@Injectable({
  providedIn: 'root'
})
export class FormGroupService {

  constructor() { }


  createFormGroup(mode: string,
                  metaEntityName: string,
                  metaPageMap: Map<string, MetaPage>,
                  metaEntityMap: Map<string, MetaEntity>,
                  entity: Entity | null,
                  recursive = true
  ) {
    // const controls: {
    //   [key: string]: AbstractControl;
    // } = {};

    const formGroup = new FormGroup({});

    const metaEntity = metaEntityMap.get(metaEntityName);
    if (!metaEntity) {
      throw new Error(`Unable to find template MetaEntity of ${metaEntityName}`);
    }

    // loop through all MetaAttributes and add FormControls for each attribute
    for (const nextAttribute of metaEntity.attributes) {
      let abstractControl: AbstractControl | null = null; // might be a FormGroup, FormArray or a FormControl

      switch (nextAttribute.type) {
        case AttributeType.OneToMany:
          abstractControl = this.formControlForOneToMany(nextAttribute, mode, metaEntityName, metaPageMap, metaEntityMap, entity);
          break;
        case AttributeType.OneToPoly:
          abstractControl = this.formControlForOneToPoly(nextAttribute, mode, metaPageMap, metaEntityMap, entity);
          break;
        case AttributeType.ManyToOne:
          if(recursive) {
            abstractControl = this.formControlForManyToOne(nextAttribute, mode, metaPageMap, metaEntityMap, entity);

            // experiment attempting to use setValue() instead of patchValue() need to populate all attributes from data entity
            const controlName = (nextAttribute.name + '_id').toLowerCase();
            formGroup.addControl(controlName, new FormControl(''));
            console.log(`Added control for: ${controlName}`);
          } // else recursion flag is false so don't drill down any further (need to break circular relationships)
          break;
        case AttributeType.OneToOne:
          abstractControl = this.formControlForOneToOne(nextAttribute, mode, metaPageMap, metaEntityMap, entity);

          // experiment attempting to use setValue() instead of patchValue() need to populate all attributes from data entity
          const controlName = (nextAttribute.name + '_id').toLowerCase();
          formGroup.addControl(controlName, new FormControl(''));
          console.log(`Added control for: ${controlName}`);
          break;
        case AttributeType.Date:
          abstractControl = this.formControlForDate(mode);
          break;
        case AttributeType.Boolean:
          abstractControl = this.formControlForBoolean();
          break;
        default:
          // WARNING: This has been a bit of a cockroach problem. One of these two lines is "correct" but depending on
          // the low level sequence of processing elsewhere the "right" answer is either '' or null. If you change this
          // line you'll probably get subtle bugs elsewhere. Ideally I'd like it to be null but Angular and JS seem to
          // prefer ''. Don't even get me started on undefined.
          //abstractControl = new FormControlWithAttribute({value: null, disabled: mode === 'view'});
          abstractControl = new FormControlWithAttribute({value: '', disabled: mode === 'view'});
      }

      if(abstractControl) {
        if(nextAttribute.visibility === VisibilityType.Required) {
          abstractControl.addValidators(Validators.required);
        }

        (abstractControl as any).attribute = nextAttribute;
        //controls[nextAttribute.name] = abstractControl;
        formGroup.addControl(nextAttribute.name, abstractControl);
      }
      else {
        //console.warn(`No abstractControl created for:`, nextAttribute);
      }
    }

    // Experimental: For each form add two extra for createdAt and updatedAt fields so that setValue() doesn't barf with
    // NG01001: Cannot find form control with name: 'createdAt'
    // controls['createdAt'] = this.formControlForDate(mode);
    // controls['updatedAt'] = this.formControlForDate(mode);
    formGroup.addControl('createdAt', this.formControlForDate(mode));
    formGroup.addControl('updatedAt', this.formControlForDate(mode));

    return formGroup;
  }

  private formControlForOneToMany(attribute: MetaAttribute,
                                  mode: string,
                                  metaEntityName: string,
                                  metaPageMap: Map<string, MetaPage>,
                                  metaEntityMap: Map<string, MetaEntity>,
                                  entity: any) {
    const formControl = new FormArrayWithAttribute([]);
    const itemArray: [] | null = entity ? (entity as any)[attribute.name] as [] : null;
    if (itemArray) {
      let itemCount = itemArray.length;
      if(itemCount > 0) {
        const childEntityName = attribute.relationshipTarget;
        for (let i = 0; i < itemCount; i++) {
          const childEntity = itemArray[i];
          const fg = this.createFormGroup(mode, childEntityName, metaPageMap, metaEntityMap, childEntity);

          // experiment attempting to use setValue() instead of patchValue() need to populate all attributes from data entity
          const controlName = metaEntityName + 'Id';
          fg.addControl(controlName, new FormControl(''));
          console.log(`Added control for: ${controlName}`);

          formControl.push(fg);
        }
      }
    }
    return formControl;
  }

  private formControlForOneToPoly(attribute: MetaAttribute,
                                  mode: string,
                                  metaPageMap: Map<string, MetaPage>,
                                  metaEntityMap: Map<string, MetaEntity>,
                                  entity: any) {
    const formControl = new FormArrayWithAttribute([]);

    // TODO: more here iterating through the children and creating their Form Controls
    const itemArray = entity ? (entity as any)[attribute.name] as [] : null;
    let itemCount = itemArray ? itemArray.length : 0;
    if (itemArray && itemCount > 0) {
      for (let i = 0; i < itemCount; i++) {
        const childEntity = itemArray[i];
        const discriminator = attribute.discriminator;
        const childDiscriminatorValue = childEntity[discriminator.discriminatorName];
        const childEntityMapping = discriminator.entityMappingList.find(a => a.discriminatorValue === childDiscriminatorValue);
        if(childEntityMapping) {
          const childPageName = childEntityMapping.metaEntityName + ".view_edit"
          const childPage = metaPageMap.get(childPageName);
          if(childPage) {
            const childTemplate = childPage.templates[0];
            console.log(`Adding formGroup for; ${attribute.name}, ${childDiscriminatorValue}, ${childPageName}`);
            formControl.push(this.createFormGroup(mode, childTemplate.metaEntityName, metaPageMap, metaEntityMap, childEntity))
          }
        }
      }
    }

    return formControl;
  }

  private formControlForManyToOne(attribute: MetaAttribute,
                                  mode: string,
                                  metaPageMap: Map<string, MetaPage>,
                                  metaEntityMap: Map<string, MetaEntity>,
                                  entity: any): AbstractControl {
    // const childEntityName = attribute.relationshipTarget;
    // const childEntity = entity ? (entity as any)[attribute.name] : null;
    // const childFormGroup = this.createFormGroup(mode, childEntityName, metaPageMap, metaEntityMap, childEntity, false);
    // return childFormGroup;
    const formControl = new FormControlWithAttribute();
    return formControl;
  }

  private formControlForOneToOne(attribute: MetaAttribute,
                                 mode: string,
                                 metaPageMap: Map<string, MetaPage>,
                                 metaEntityMap: Map<string, MetaEntity>,
                                 entity: any): FormGroup {

    const childEntityName = attribute.relationshipTarget;
    const childEntity = entity ? (entity as any)[attribute.name] : null;
    return this.createFormGroup(mode, childEntityName, metaPageMap, metaEntityMap, childEntity);
  }

  private formControlForDate(mode: string): FormControl {
    // See WARNING below: Date does need to be null, otherwise empty string is treated as an invalid Date and prevents
    // "no value" optional dates from allowing the form validation to be valid
    return new FormControlWithAttribute({value: null, disabled: mode === 'view'});
  }

  private formControlForBoolean(): FormControl {
    // It's important to set this to false as the default value because otherwise the database will reject the default value of ''
    return new FormControlWithAttribute(false);
  }
}
