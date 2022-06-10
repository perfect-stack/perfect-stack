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

  onManyToOneItemSelected(ctx: FormContext, attribute: MetaAttribute, itemSelected: any): void {
  }

  onPageLoad(ctx: FormContext, params: ParamMap, queryParams: ParamMap): void {
    const birdId = queryParams.get('bird_id');
    console.log(`onPageLoad. birdId = ${birdId}`);
    if(birdId) {
      this.dataService.findById('Bird', birdId).subscribe((entity) => {
        const birdEntity = entity as any;
        console.log(`GOT bird entity ${birdEntity.name}`);
        const eventForm = ctx.formMap.get('event') as FormGroup;
        if(eventForm) {
          const birdControl = eventForm.controls['bird'];
          if(birdControl) {
            console.log(`Found form and control, patching in Bird data now for; ${birdEntity.name}`);
            birdControl.patchValue(birdEntity);
            eventForm.controls['status'].setValue(birdEntity.status);
            eventForm.controls['species'].setValue(birdEntity.species);
            eventForm.controls['form'].setValue(birdEntity.form);
            eventForm.controls['sex'].setValue(birdEntity.sex);
            eventForm.controls['age_class'].setValue(birdEntity.age_class);
          }
          else {
            console.warn('Unable to find bird control');
          }
        }
        else {
          console.warn('Unable to find event form');
        }
      });
    }
  }

}
