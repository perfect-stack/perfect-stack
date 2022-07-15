import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormGroup, NgControl} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {Observable, Subscription, tap} from 'rxjs';
import {FormContext, FormService} from '../../../../data-edit/form-service/form.service';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {MetaPage} from '../../../../../domain/meta.page';

@Component({
  selector: 'lib-spy-control',
  templateUrl: './spy-control.component.html',
  styleUrls: ['./spy-control.component.css']
})
export class SpyControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string;

  @Input()
  formGroup: FormGroup;

  @Input()
  cell: CellAttribute;

  @Input()
  attribute: MetaAttribute;

  disabled = false;
  spyTemplate: string;

  targetValue: any;

  spyCtx$: Observable<FormContext>;

  formGroupSubscription: Subscription;

  constructor(protected readonly formService: FormService,
              public ngControl: NgControl) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    if(this.cell && this.cell.component) {
      this.spyTemplate = (this.cell as any).spyTemplate;
    }

    if(this.formGroup && this.attribute) {
      this.formGroupSubscription = this.formGroup.controls[this.attribute.name + '_id'].valueChanges.subscribe((nextValue) => {
        console.log(`Spy detects update in target attribute ${this.attribute.relationshipTarget}`, nextValue);
        this.targetValue = nextValue;

        const metaName = this.attribute.relationshipTarget;
        const mode = 'view';
        const entityId = nextValue;

        this.spyCtx$ = this.formService.loadFormContext(metaName, mode, entityId, null, null);
      });
    }
  }

  getSpyTemplate(metaPageMap: Map<string, MetaPage>) {
    const metaPage = metaPageMap.get(this.spyTemplate);
    if(metaPage) {
      return metaPage.templates[0];
    }
    else {
      throw new Error(`Unable to find spy template for: ${this.spyTemplate}`);
    }
  }

  set value(val: string){

    // spy control doesn't update anything, it only watches the field it's bound to

    // this.selectedEntityId = val
    // this.onChange(val)
  }

  onChange: any = () => {}
  onTouch: any = () => {}

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(obj: any): void {
    this.value = obj;
  }

  ngOnDestroy(): void {
    if(this.formGroupSubscription) {
      this.formGroupSubscription.unsubscribe();
    }
  }
}
