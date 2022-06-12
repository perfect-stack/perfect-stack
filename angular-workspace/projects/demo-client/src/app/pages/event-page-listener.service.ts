import { Injectable } from '@angular/core';
import {PageListener} from '../../../../ngx-perfect-stack/src/lib/event/page-listener';
import {FormContext} from '../../../../ngx-perfect-stack/src/lib/data/data-edit/form-service/form.service';
import {ParamMap} from '@angular/router';
import {MetaAttribute} from '../../../../ngx-perfect-stack/src/lib/domain/meta.entity';
import {DataService} from '../../../../ngx-perfect-stack/src/lib/data/data-service/data.service';
import {FormGroup} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class EventPageListenerService implements PageListener {

  constructor(protected readonly dataService: DataService) {
  }

  onAfterSave(ctx: FormContext): void {
  }

  onBeforeSave(ctx: FormContext): void {
  }

  onManyToOneItemSelected(formGroup: FormGroup, attribute: MetaAttribute, itemSelected: any): void {
    console.log(`onManyToOneItemSelected for ${attribute.name}`, itemSelected);
    if(attribute.name === 'bird') {
      this.loadBird(itemSelected.id, formGroup, false);
    }
    else if(attribute.name === 'location') {
      this.loadLocation(itemSelected.id, formGroup);
    }
  }

  onPageLoad(ctx: FormContext, params: ParamMap, queryParams: ParamMap): void {
    const birdId = queryParams.get('bird_id');
    console.log(`onPageLoad. birdId = ${birdId}`);
    if(birdId) {
      const eventFormGroup = ctx.formMap.get('event') as FormGroup;
      if(eventFormGroup) {
        this.loadBird(birdId, eventFormGroup, true);
      }
      else {
        console.warn('Unable to find event form');
      }
    }
  }

  loadBird(birdId: string, formGroup: FormGroup, emitEvent: boolean) {
    this.dataService.findById('Bird', birdId).subscribe((entity) => {
      const birdEntity = entity as any;
      console.log(`GOT bird entity ${birdEntity.name}`);
      const birdControl = formGroup.controls['bird'];
      if(birdControl) {
        console.log(`Found form and control, patching in Bird data now for; ${birdEntity.name}`);
        birdControl.patchValue(birdEntity, {emitEvent: emitEvent});
        formGroup.controls['status'].setValue(birdEntity.status);
        formGroup.controls['species'].setValue(birdEntity.species);
        formGroup.controls['form'].setValue(birdEntity.form);
        formGroup.controls['sex'].setValue(birdEntity.sex);
        formGroup.controls['age_class'].setValue(birdEntity.age_class);
      }
      else {
        console.warn('Unable to find bird control');
      }
    });
  }

  loadLocation(locationId: string, formGroup: FormGroup) {
    this.dataService.findById('Location', locationId).subscribe((entity) => {
      const locationEntity = entity as any;
      console.log(`GOT location entity`, locationEntity);
      const locationControl = formGroup.controls['location'];
      if(locationControl) {
        locationControl.patchValue(locationEntity, {emitEvent: false});
        formGroup.controls['easting'].setValue(locationEntity.easting);
        formGroup.controls['northing'].setValue(locationEntity.northing);
      }
    });
  }

}
