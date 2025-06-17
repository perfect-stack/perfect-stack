import {Component, Injector, OnInit} from '@angular/core';
import {Observable, tap, withLatestFrom} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {FormContext, FormService} from './form-service/form.service';
import * as uuid from 'uuid';
import {AttributeType} from '../../domain/meta.entity';
import {
  DoubleVisitor,
  IdentifierVisitor,
  IntegerVisitor,
  MetaEntityTreeWalker
} from '../../utils/tree-walker/meta-entity-tree-walker';
import {DebugService} from '../../utils/debug/debug.service';
import {EventService} from '../../event/event.service';
import {CompletionResult} from '../../event/page-listener';
import {AbstractControl, FormGroup, UntypedFormArray, UntypedFormGroup} from '@angular/forms';
import {SaveResponse} from '../data-service/save.response';
import {ValidationResultMapController} from '../../domain/meta.rule';
import {ToastService} from '../../utils/toasts/toast.service';
import {SearchControllerService} from '../controller/search-controller.service';
import {ActionType} from '../../domain/meta.role';
import {MessageDialogComponent} from '../../utils/message-dialog/message-dialog.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'app-data-edit',
    templateUrl: './data-edit.component.html',
    styleUrls: ['./data-edit.component.scss'],
    standalone: false
})
export class DataEditComponent implements OnInit {

  public metaName: string | null;
  public mode: string | null;
  public entityId: string | null;

  ctx$: Observable<FormContext>;

  deleteAvailable = false;
  deleteCheck: DeleteCheckType = DeleteCheckType.Unknown;

  constructor(public readonly debugService: DebugService,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly dataService: DataService,
              protected readonly toastService: ToastService,
              protected readonly eventService: EventService,
              protected readonly modalService: NgbModal,
              protected readonly injector: Injector) {}

  ngOnInit(): void {
    this.route.url.pipe(
      withLatestFrom(this.route.paramMap, this.route.queryParamMap)
    ).subscribe(([url, paramMap,  queryParamMap]) => {

      this.metaName = paramMap.get('metaName');
      this.mode = paramMap.get('mode');
      this.entityId = this.toUuid(paramMap.get('id'));

      console.log('queryParamMap', queryParamMap.keys);

      if(this.metaName && this.mode) {
        this.ctx$ = this.formService.loadFormContext(this.metaName, this.mode, this.entityId, paramMap, queryParamMap).pipe(tap((ctx) => {

          this.deleteAvailable = ctx.metaEntity.permanentDelete;
          if(this.deleteAvailable && this.mode !== 'view' && this.metaName && this.entityId) {
            this.dataService.destroyCheck(this.metaName, this.entityId).subscribe((destroyEnabled) => {
              console.log('destroyCheck got response', destroyEnabled);
              this.deleteCheck = destroyEnabled ? DeleteCheckType.Yes : DeleteCheckType.No;
            });
          }

          this.attachControllers(ctx);
          this.eventService.dispatchOnAction(ctx.metaPage.name, '*', ctx, 'init');
          this.eventService.dispatchOnPageLoad(ctx.metaPage.name, ctx, paramMap, queryParamMap);
        }));
      }
      else {
        throw new Error('Invalid input parameters; ');
      }
    });
  }

  /**
   * Convert the controller metadata into a proper service/class and add the controllers to the EventService so that
   * they receive events from the page components.
   */
  attachControllers(ctx: FormContext) {
    if(ctx.metaPage.controllers) {
      for(const controller of ctx.metaPage.controllers) {

        // TODO: was looking for a DI friendly way of doing this but Angular services are typically only created once. Needs more thought.
        //const controllerService = this.injector.get(controller.class) as any;
        const controllerService: any = new SearchControllerService(this.dataService, this.formService);

        // copy the properties of the metadata into the service
        for(const nextProperty of controllerService.propertyList) {
          controllerService[nextProperty.name] = (controller as any)[nextProperty.name];
        }

        const channel = controllerService.channel ? controllerService.channel : '';
        this.eventService.addActionListener(controllerService, ctx.metaPage.name, channel);
      }
    }
  }

  /**
   * When the page is destroyed remove the controllers from the EventService.
   */
  detachControllers() {

  }

  toUuid(value: string | null) {
    if(value === null || value === '**NEW**') {
      return null;
    }
    else {
      // will throw error if invalid, caller should bail out of use case
      uuid.parse(value);
      return value;
    }
  }

  onBack() {
    this.router.navigate([`/data/${this.metaName}/search`]);
  }

  onEdit() {
    this.router.navigate([`/data/${this.metaName}/edit`, this.entityId]);
  }

  onCancel(ctx: FormContext, saveResponse: SaveResponse | null): Promise<boolean> {

    let completionResult = this.eventService.dispatchOnCompletion(ctx.metaPage.name, ctx, saveResponse);
    if(completionResult === CompletionResult.Stop) {
      return new Promise(() => false);
    }

    const entityIdToView = this.entityId ? this.entityId : saveResponse && saveResponse.entity ? saveResponse.entity.id : null;
    if(entityIdToView) {
      return this.router.navigate([`/data/${this.metaName}/view`, entityIdToView]);
    }
    else {
      return this.router.navigate([`/data/${this.metaName}/search`]);
    }
  }

  getDataForm(ctx: FormContext) {
    // TODO: so that entityForm could be removed from FOrmContext we are going to use a rule that says an edit page
    // only has one form and so we can get the one and only form out of the formMap. Once this changes to some sort
    // of template approach then the template binding will be needed here to find the form to get the entityData
    return ctx.formMap.values().next().value;

    // WARNING: Same logic in AuditViewComponent
  }


  onSave(ctx: FormContext) {
    console.log('onSave() - STARTED');

    // TODO: this is wrong since it now depends on entityForm
    //const entityData = ctx.entityForm.value;

    // TODO: so that entityForm could be removed from FormContext we are going to use a rule that says an edit page
    // only has one form and so we can get the one and only form out of the formMap. Once this changes to some sort
    // of template approach then the template binding will be needed here to find the form to get the entityData
    const form = this.getDataForm(ctx);
    console.log('onSave() - GOT FORM');

    if(form) {
      this.validateAllFields('root', form);
      console.log('onSave() - VALIDATION');
    }

    if(form && form.valid) {
      console.log('onSave() - VALID');
      const entityData = form.value;
      console.log(`DataEdit: form value:`, entityData);

      const treeWalker = new MetaEntityTreeWalker(ctx.metaEntityMap, ctx.discriminatorMap);
      treeWalker.byType(AttributeType.Double, new DoubleVisitor());
      treeWalker.byType(AttributeType.Integer, new IntegerVisitor());
      treeWalker.byType(AttributeType.Identifier, new IdentifierVisitor());
      //treeWalker.byType(AttributeType.ManyToOne, new ManyToOneVisitor());
      treeWalker.walk(entityData, ctx.metaEntity);
      console.log(`DataEdit: save value:`, entityData);

      if(this.metaName) {
        this.dataService.save(this.metaName, entityData).subscribe((response: SaveResponse) => {
          if(response.validationResults) {
            const validationResultController = new ValidationResultMapController(response.validationResults);
            if(validationResultController.hasErrors()) {
              this.saveRejected(ctx, response);
            }
            else {
              this.saveCompleted(ctx, response);
            }
          }
          else {
            this.saveCompleted(ctx, response);
          }
        });
      }
    }
    else {
      console.log('onSave() - INVALID');
    }
  }

  saveRejected(ctx: FormContext, response: SaveResponse) {
    console.log(`Save rejected:`, response.validationResults);
    this.toastService.showError('Error while saving. Please check form for errors.', true);
    const form = this.getDataForm(ctx) as FormGroup;
    let keys = Object.keys(response.validationResults);
    keys.forEach((k: string) => {
      console.log(`Looking for control; ${k}`);
      const control = form.get(k);
      if(control) {
        console.log('set error', response.validationResults[k]);
        console.log('set error control', control);
        control.setErrors(response.validationResults[k]);
        //control.markAsTouched();
      }
      else {
        console.log(`Did not find control; ${k} looking for control with _id suffix`);

        const control_id_key =`${k}_id`;
        const control_id = form.get(control_id_key);
        if(control_id) {
          console.log('set error', response.validationResults[control_id_key]);
          console.log('set error control', control);
          control_id.setErrors(response.validationResults[k]); // this is without the _id so that location => location_id
        }
        else {
          console.warn(`Unable to find control; "${k}". Validation error will not be displayed.`);
        }
      }
    });
  }

  saveCompleted(ctx: FormContext, response: SaveResponse) {
    this.onCancel(ctx, response).then(() => {
      this.toastService.showSuccess('Save is successful');
    });
  }

  /**
   * The form can be invalid, but the save button is not disabled until the user has had a chance to make changes of
   * some kind and the form become "touched". The onSave() action above will do validation checks and not save the
   * form if it is not valid.
   */
  isSaveDisabled(ctx: FormContext) {
    const dataForm = this.getDataForm(ctx);
    return dataForm && dataForm.touched && !dataForm.valid;
  }

  validateAllFields(name: string, abstractControl: AbstractControl) {
    abstractControl.updateValueAndValidity();
    abstractControl.markAsTouched();
    if(!abstractControl.valid) {
      console.warn(`${name} - INVALID: touched: ${abstractControl.touched}, untouched: ${abstractControl.untouched}`);
    }

    if (abstractControl instanceof UntypedFormGroup) {
      console.log(`validateAllFields: ${name} - UntypedFormGroup`, abstractControl.validator);
      const fg = abstractControl as UntypedFormGroup;
      Object.keys(fg.controls).forEach(key => {
        this.validateAllFields(key, fg.controls[key]);
      });
    }
    else if( abstractControl instanceof  UntypedFormArray) {
      console.log(`validateAllFields: ${name} - UntypedFormArray`, abstractControl.validator);
      const formArray = abstractControl as UntypedFormArray;
      for(let i = 0; i < formArray.length; i++) {
        const nextChildControl = formArray.at(i);
        this.validateAllFields(`${name}[${i}]`, nextChildControl);
      }
    }
    else {
      console.log(`validateAllFields: ${name} - Unknown type`, abstractControl.validator);
    }
  }

  get ActionType() {
    return ActionType;
  }

  onDeletePrompt(ctx: FormContext) {
    console.log('On Delete Prompt');
    const modalRef = this.modalService.open(MessageDialogComponent)
    const modalComponent: MessageDialogComponent = modalRef.componentInstance;
    modalComponent.title = `Delete ${this.metaName} Confirmation`;
    modalComponent.text = `This action will delete this ${this.metaName}. It cannot be undone.`;
    modalComponent.actions = [
      {name: 'Cancel', style: 'btn btn-outline-primary'},
      {name: 'Delete', style: 'btn btn-danger'},
    ];

    modalRef.closed.subscribe((closedResult) => {
      console.log(`Message Dialog closedResult = ${closedResult}`);
      if(this.metaName && this.entityId && closedResult === 'Delete') {
        this.dataService.destroy(this.metaName, this.entityId).subscribe((result) => {
          console.log(`Entity ${this.metaName} destroy requested.`, result);
          const resultNumber = Number(result);
          if(resultNumber > 0) {
            this.toastService.showSuccess(`${this.metaName} deleted successfully`);
            this.onBack();
          }
          // else some other error should pop up (?)
        });
      }
    });
  }

  get DeleteCheckType() {
    return DeleteCheckType;
  }
}


enum DeleteCheckType {
  Unknown = 'Unknown',
  Yes = 'Yes',
  No = 'No'
}
