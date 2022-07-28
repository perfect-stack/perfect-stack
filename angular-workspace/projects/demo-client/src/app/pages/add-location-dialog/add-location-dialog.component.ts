import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Observable} from 'rxjs';
import {
  FormContext,
  FormService
} from '../../../../../ngx-perfect-stack/src/lib/data/data-edit/form-service/form.service';
import {AbstractControl, FormGroup, UntypedFormArray, UntypedFormGroup} from '@angular/forms';
import {
  DoubleVisitor, IdentifierVisitor, IntegerVisitor,
  MetaEntityTreeWalker
} from '../../../../../ngx-perfect-stack/src/lib/utils/tree-walker/meta-entity-tree-walker';
import {AttributeType} from '../../../../../ngx-perfect-stack/src/lib/domain/meta.entity';
import {DataService} from '../../../../../ngx-perfect-stack/src/lib/data/data-service/data.service';

@Component({
  selector: 'app-add-location-dialog',
  templateUrl: './add-location-dialog.component.html',
  styleUrls: ['./add-location-dialog.component.scss']
})
export class AddLocationDialogComponent implements OnInit {

  ctx$: Observable<FormContext>;

  constructor(public activeModal: NgbActiveModal,
              protected readonly dataService: DataService,
              protected readonly formService: FormService) {
    this.ctx$ = this.formService.loadFormContext('Location', 'edit', null, null, null);
  }

  ngOnInit(): void {
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  onSave(ctx: FormContext) {
    const form = this.getFormGroup(ctx);
    this.validateAllFields('root', form);

    if(form.valid) {
      const entityData = form.value;
      console.log(`DataEdit: form value:`, entityData);

      const treeWalker = new MetaEntityTreeWalker(ctx.metaEntityMap);
      treeWalker.byType(AttributeType.Double, new DoubleVisitor());
      treeWalker.byType(AttributeType.Integer, new IntegerVisitor());
      treeWalker.byType(AttributeType.Identifier, new IdentifierVisitor());
      treeWalker.walk(entityData, ctx.metaEntity);
      console.log(`Save value:`, entityData);

      this.dataService.save('Location', entityData).subscribe((saveResult:any) => {
        const id = saveResult.entity.id;
        this.activeModal.close(id);
      });
    }
  }

  /**
   * The form can be invalid, but the save button is not disabled until the user has had a chance to make changes of
   * some kind and the form become "touched". The onSave() action above will do validation checks and not save the
   * form if it is not valid.
   */
  isSaveDisabled(ctx: FormContext) {
    const dataForm = this.getFormGroup(ctx);
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
    }
    else if( abstractControl instanceof  UntypedFormArray) {
      const formArray = abstractControl as UntypedFormArray;
      for(let i = 0; i < formArray.length; i++) {
        const nextChildControl = formArray.at(i);
        this.validateAllFields(`${name}[${i}]`, nextChildControl);
      }
    }
  }

  getFormGroup(ctx: FormContext): FormGroup {
    if(ctx.formMap.has('location')) {
      return ctx.formMap.get('location') as FormGroup;
    }
    else {
      throw new Error('Unable to find form in formMap for Location');
    }
  }
}
