import { Injectable } from '@angular/core';
import {CompletionResult, PageListener} from '../../../../ngx-perfect-stack/src/lib/event/page-listener';
import {
  FormArrayWithAttribute,
  FormContext
} from '../../../../ngx-perfect-stack/src/lib/data/data-edit/form-service/form.service';
import {ParamMap, Router} from '@angular/router';
import {MetaAttribute} from '../../../../ngx-perfect-stack/src/lib/domain/meta.entity';
import {DataService} from '../../../../ngx-perfect-stack/src/lib/data/data-service/data.service';
import {FormGroup, UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {AddLocationDialogComponent} from './add-location-dialog/add-location-dialog.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SaveResponse} from '../../../../ngx-perfect-stack/src/lib/data/data-service/save.response';
import {ToastService} from '../../../../ngx-perfect-stack/src/lib/utils/toasts/toast.service';
import {FormGroupService} from '../../../../ngx-perfect-stack/src/lib/data/data-edit/form-service/form-group.service';

@Injectable({
  providedIn: 'root'
})
export class EventPageListenerService implements PageListener {

  constructor(protected readonly dataService: DataService,
              protected readonly toastService: ToastService,
              private modalService: NgbModal,
              private fb: UntypedFormBuilder,
              private formGroupService: FormGroupService,
              protected readonly router: Router) {
  }

  onAfterSave(ctx: FormContext): void {
  }

  onBeforeSave(ctx: FormContext): void {
  }

  onAction(ctx: FormContext, channel: string, action: string): void {
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
      this.updateEventTypeDefaults(ctx, eventType);
    }

    // If there are errors attached to the event_type field then we need to clear them if the user "fixes" the error
    // by making changes to the observers
    const eventFormGroup = ctx.formMap.get('event') as UntypedFormGroup;
    if(eventFormGroup) {
      eventFormGroup.controls['observers'].valueChanges.subscribe(() => {
        this.clearControlErrors(eventFormGroup, 'event_type');
      });

      eventFormGroup.controls['date_time'].valueChanges.subscribe((nextValue) => {
        this.updateEndDateTime(eventFormGroup, nextValue);
      });
    }
  }

  updateEventTypeDefaults(ctx: FormContext, eventType: string) {
    const eventFormGroup = ctx.formMap.get('event') as UntypedFormGroup;
    if(eventFormGroup) {
      console.log(`onPageLoad: eventType = ${eventType}`)
      eventFormGroup.controls['event_type'].setValue(eventType);
      console.log(`onPageLoad: eventType setValue completed.`)



      if(eventType === 'Audio') {
        console.log('Audio Event detected');

        const birdDetailsTemplate = ctx.metaPage.templates.find(s => s.templateHeading && s.templateHeading.indexOf('Bird details') > -1);
        if(birdDetailsTemplate) {
          birdDetailsTemplate.visible = false;
        }

        this.addActivity(ctx, 'CallCountActivity', {
          activity_type: 'Call count',
          count_type_id: 'd704c184-c9d5-480e-9e1a-42fbf2fd2e66',
          calls: []
        });

        this.addActivity(ctx, 'WeatherActivity', {
          activity_type: 'Weather',
        });
      }
    }
  }

  addActivity(ctx: FormContext, activityEntityName: string, activityItem: any) {
    const itemFormGroup = this.formGroupService.createFormGroup(ctx.mode, activityEntityName, ctx.metaPageMap, ctx.metaEntityMap, null);
    itemFormGroup.addControl('activity_type', this.fb.control(''));
    // update the item formGroup
    itemFormGroup.patchValue(activityItem);

    const eventFormGroup = ctx.formMap.get('event') as UntypedFormGroup;
    const activitiesControl = eventFormGroup.controls['activities'] as FormArrayWithAttribute;
    activitiesControl.push(itemFormGroup);
    itemFormGroup.patchValue(activityItem);
  }

  updateEndDateTime(eventFormGroup: FormGroup<any>, nextValue: any) {
    const endDateTimeControl = eventFormGroup.controls['end_date_time'];
    const endDateTimeValue = endDateTimeControl.value;
    if(nextValue.length > 10 && !endDateTimeValue) {
      endDateTimeControl.setValue(nextValue);
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

  onCompletion(ctx: FormContext, saveResponse: SaveResponse | null): string {
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
          const entityIdToView = eventId && eventId != '**NEW**' ? eventId : saveResponse && saveResponse.entity ? saveResponse.entity.id : null;
          if(entityIdToView) {
            route = `/data/Event/view/${entityIdToView}`;
          }
          else {
            route = `/data/Event/search`;
          }
        }
        else {
          throw new Error('No entity to view');
        }
      }

      this.router.navigateByUrl(route).then(() => {
        if(saveResponse) {
          this.toastService.showSuccess('Save is successful');
        }
        else {
          console.log('No saveResponse, so will not show toast message');
        }
      });
    }

    return CompletionResult.Stop;
  }
}
