import { Injectable } from '@angular/core';
import {CompletionResult, PageListener} from '../../../../ngx-perfect-stack/src/lib/event/page-listener';
import {
  FormArrayWithAttribute,
  FormContext
} from '../../../../ngx-perfect-stack/src/lib/data/data-edit/form-service/form.service';
import {ParamMap, Router} from '@angular/router';
import {MetaAttribute} from '../../../../ngx-perfect-stack/src/lib/domain/meta.entity';
import {DataService} from '../../../../ngx-perfect-stack/src/lib/data/data-service/data.service';
import {FormGroup, UntypedFormGroup} from '@angular/forms';
import {AddLocationDialogComponent} from './add-location-dialog/add-location-dialog.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root'
})
export class EventPageListenerService implements PageListener {

  constructor(protected readonly dataService: DataService,
              private modalService: NgbModal,
              protected readonly router: Router) {
  }

  onAfterSave(ctx: FormContext): void {
  }

  onBeforeSave(ctx: FormContext): void {
  }

  onAction(ctx: FormContext, action: string): void {
    if(action === 'CreateLocation') {
      console.log(`Custom page hook ready to: ${action}`);
      this.createLocation(ctx);
    }
  }

  createLocation(ctx: FormContext) {
    const modalRef = this.modalService.open(AddLocationDialogComponent, {size: 'xl'}).closed.subscribe((locationId) => {
      console.log(`EventPageListenerService: created location with locationId = ${locationId}`);
      if(locationId) {
        const locationForm = ctx.formMap.get('event');
        if(locationForm) {
          this.loadLocation(locationId, locationForm as FormGroup);
        }
      }
    });
  }

  onManyToOneItemSelected(formGroup: UntypedFormGroup, attribute: MetaAttribute, itemSelected: any): void {
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
    if(birdId) {
      console.log(`onPageLoad. birdId = ${birdId}`);
      const eventFormGroup = ctx.formMap.get('event') as UntypedFormGroup;
      if(eventFormGroup) {
        this.loadBird(birdId, eventFormGroup, true);
      }
      else {
        console.warn('Unable to find event form');
      }
    }

    const eventType = queryParams.get('event_type');
    if(eventType) {
      const eventFormGroup = ctx.formMap.get('event') as UntypedFormGroup;
      if(eventFormGroup) {
        console.log(`onPageLoad: eventType = ${eventType}`)
        eventFormGroup.controls['event_type'].setValue(eventType);
        console.log(`onPageLoad: eventType setValue completed.`)
      }
    }
  }

  loadBird(birdId: string, formGroup: UntypedFormGroup, emitEvent: boolean) {
    this.dataService.findById('Bird', birdId).subscribe((entity) => {
      const birdEntity = entity as any;
      console.log(`GOT bird entity ${birdEntity.name}`);
      const birdControl = formGroup.controls['bird_id'];
      if(birdControl) {
        console.log(`Found FormGroup and bird control, patching in Bird data now for ${birdEntity.name}`);
        birdControl.patchValue(birdEntity.id, {emitEvent: emitEvent});
        formGroup.controls['status'].setValue(birdEntity.status);
        formGroup.controls['species_id'].setValue(birdEntity.species ? birdEntity.species.id : '');
        formGroup.controls['form'].setValue(birdEntity.form);
        formGroup.controls['sex'].setValue(birdEntity.sex);
        formGroup.controls['age_class'].setValue(birdEntity.age_class);

        // When a Bird is added to the Event we need to clear any Validation errors that may be associated with
        // the Marking Activities of the Event so that the user does not need to manually edit the fields to clear the error
        // Loop through all activities in the form
        const activitiesControl = formGroup.controls['activities'] as FormArrayWithAttribute;
        if(activitiesControl) {
          for(let i = 0; i < activitiesControl.length; i++) {
            const nextActivityFormGroup = activitiesControl.at(i) as FormGroup;

            // If the activity has a marking activity then clear the validation errors of that marking field
            if(nextActivityFormGroup) {
              const activityType = nextActivityFormGroup.controls['activity_type'].value;

              switch (activityType) {
                case 'Banding':
                  this.clearControlErrors(nextActivityFormGroup, 'band');
                  break;
                case 'Microchip':
                  this.clearControlErrors(nextActivityFormGroup, 'microchip');
                  break;
                case 'Wing tag':
                  this.clearControlErrors(nextActivityFormGroup, 'wing_tag');
                  break;
              }
            }
          }
        }
      }
      else {
        console.warn('Unable to find bird control');
      }
    });
  }

  clearControlErrors(formGroup: FormGroup, controlName: string) {
    const control = formGroup.controls[controlName];
    if(control) {
      control.setErrors(null);
    }
  }

  loadLocation(locationId: string, formGroup: UntypedFormGroup) {
    this.dataService.findById('Location', locationId).subscribe((entity) => {
      const locationEntity = entity as any;
      console.log(`GOT location entity`, locationEntity);
      const locationControl = formGroup.controls['location_id'];
      if(locationControl) {
        locationControl.patchValue(locationEntity.id, {emitEvent: false});
        formGroup.controls['easting'].setValue(locationEntity.easting);
        formGroup.controls['northing'].setValue(locationEntity.northing);
        formGroup.controls['altitude'].setValue(locationEntity.altitude);
      }
    });
  }

  onCompletion(ctx: FormContext): string {
    console.log('Got onCompletionEvent() queryParams:', ctx.queryParamMap);
    const queryParamMap = ctx.queryParamMap;
    if(queryParamMap) {
      const birdId = queryParamMap.get('bird_id');
      let route = 'NONE';
      if(birdId) {
        route = `/data/Bird/view/${birdId}`
      }
      else {
        const paramMap = ctx.paramMap;
        if(paramMap) {
          const eventId = paramMap.get('id');
          if(eventId === '**NEW**') {
            route = `/data/Event/search`;
          }
          else {
            route = `/data/Event/view/${eventId}`;
          }
        }
      }
      this.router.navigateByUrl(route);
    }

    return CompletionResult.Stop;
  }
}
