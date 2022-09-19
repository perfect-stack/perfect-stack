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


@Component({
  selector: 'app-data-edit',
  templateUrl: './data-edit.component.html',
  styleUrls: ['./data-edit.component.css']
})
export class DataEditComponent implements OnInit {

  public metaName: string | null;
  public mode: string | null;
  public entityId: string | null;

  ctx$: Observable<FormContext>;

  constructor(public readonly debugService: DebugService,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly dataService: DataService,
              protected readonly toastService: ToastService,
              protected readonly eventService: EventService,
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

  onCancel(ctx: FormContext): Promise<boolean> {

    let completionResult = this.eventService.dispatchOnCompletion(ctx.metaPage.name, ctx);
    if(completionResult === CompletionResult.Stop) {
      return new Promise(() => false);
    }

    if(this.entityId) {
      return this.router.navigate([`/data/${this.metaName}/view`, this.entityId]);
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
  }


  onSave(ctx: FormContext) {

    // TODO: this is wrong since it now depends on entityForm
    //const entityData = ctx.entityForm.value;

    // TODO: so that entityForm could be removed from FormContext we are going to use a rule that says an edit page
    // only has one form and so we can get the one and only form out of the formMap. Once this changes to some sort
    // of template approach then the template binding will be needed here to find the form to get the entityData
    const form = this.getDataForm(ctx);
    this.validateAllFields('root', form);

    if(form.valid) {
      const entityData = form.value;
      console.log(`DataEdit: form value:`, entityData);

      const treeWalker = new MetaEntityTreeWalker(ctx.metaEntityMap);
      treeWalker.byType(AttributeType.Double, new DoubleVisitor());
      treeWalker.byType(AttributeType.Integer, new IntegerVisitor());
      treeWalker.byType(AttributeType.Identifier, new IdentifierVisitor());
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
              this.saveCompleted(ctx);
            }
          }
          else {
            this.saveCompleted(ctx)
          }
        });
      }
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
        console.log(`Did not find control; ${k}`);
      }
    });
  }

  saveCompleted(ctx: FormContext) {
    this.onCancel(ctx).then(() => {
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
    return dataForm.touched && !dataForm.valid;
  }

  validateAllFields(name: string, abstractControl: AbstractControl) {
    abstractControl.updateValueAndValidity();
    abstractControl.markAsTouched();
    if(!abstractControl.valid) {
      console.warn(`${name} - INVALID: touched: ${abstractControl.touched}, untouched: ${abstractControl.untouched}`);
    }

    if (abstractControl instanceof UntypedFormGroup) {
      const fg = abstractControl as UntypedFormGroup;
      Object.keys(fg.controls).forEach(key => {
        this.validateAllFields(key, fg.controls[key]);
      });
    } else if( abstractControl instanceof  UntypedFormArray) {
      const formArray = abstractControl as UntypedFormArray;
      for(let i = 0; i < formArray.length; i++) {
        const nextChildControl = formArray.at(i);
        this.validateAllFields(`${name}[${i}]`, nextChildControl);
      }
    }
  }

  get ActionType() {
    return ActionType;
  }
}

