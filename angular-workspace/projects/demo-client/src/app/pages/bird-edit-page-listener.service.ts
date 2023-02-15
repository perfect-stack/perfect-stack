import {PageListener} from '../../../../ngx-perfect-stack/src/lib/event/page-listener';
import {ParamMap} from '@angular/router';
import {FormContext} from '../../../../ngx-perfect-stack/src/lib/data/data-edit/form-service/form.service';
import {MetaAttribute} from '../../../../ngx-perfect-stack/src/lib/domain/meta.entity';
import {FormGroup, UntypedFormGroup} from '@angular/forms';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BirdEditPageListenerService implements PageListener {

  onAction(ctx: FormContext, channel: string, action: string): void {
  }

  onAfterSave(ctx: FormContext): void {
  }

  onBeforeSave(ctx: FormContext): void {
  }

  onCompletion(ctx: FormContext): string {
    return '';
  }

  onManyToOneItemSelected(formGroup: UntypedFormGroup, attribute: MetaAttribute, itemSelected: any): void {
  }

  onPageLoad(ctx: FormContext, params: ParamMap, queryParams: ParamMap): void {
    const formGroup = ctx.formMap.get('bird') as UntypedFormGroup;
    if(formGroup) {
      this.createBirdDefaults(formGroup);
      this.addValueListeners(formGroup);
    }
  }

  createBirdDefaults(formGroup: FormGroup) {
    if(!formGroup.controls['data_source'].value) {
      formGroup.controls['data_source'].setValue('KIMS');
    }
  }

  addValueListeners(formGroup: FormGroup) {
    formGroup.controls['band'].valueChanges.subscribe(() => {
      this.clearControlErrors(formGroup, 'name');
    });

    formGroup.controls['microchip'].valueChanges.subscribe(() => {
      this.clearControlErrors(formGroup, 'name');
    });

    formGroup.controls['wing_tag'].valueChanges.subscribe(() => {
      this.clearControlErrors(formGroup, 'name');
    });
  }

  clearControlErrors(formGroup: FormGroup, controlName: string) {
    const control = formGroup.controls[controlName];
    if(control) {
      control.setErrors(null);
    }
  }
}
