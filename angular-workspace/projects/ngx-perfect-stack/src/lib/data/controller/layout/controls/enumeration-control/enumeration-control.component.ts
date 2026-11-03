import {ChangeDetectorRef, Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {ControlValueAccessor, FormGroup, NgControl} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {ValidationResult} from '../../../../../domain/meta.rule';
import {Subscription} from 'rxjs';
import {FormContext, FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {DataService} from '../../../../data-service/data.service';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';

@Component({
    selector: 'lib-enumeration-control',
    templateUrl: './enumeration-control.component.html',
    styleUrls: ['./enumeration-control.component.css'],
    standalone: false
})
export class EnumerationControlComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string | null;

  @Input()
  ctx: FormContext;

  @Input()
  cell: CellAttribute;

  @Input()
  attribute: MetaAttribute;

  // This one is needed because sometimes we need to lookup a sibling control for the "dependsOn" relationships
  @Input()
  formGroup: FormGroup;

  @Input()
  options: string[] = [];

  selectedOption: string | null = null;
  disabled = false;

  private dependsOnSubscription?: Subscription;

  constructor(public ngControl: NgControl,
              @Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly dataService: DataService,
              protected readonly cdr: ChangeDetectorRef) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    if(this.attribute && this.attribute.enumeration && this.attribute.enumeration.length > 0) {
      this.options = this.attribute.enumeration;
    }
    else if(this.cell && this.cell.dependsOn) {
      this.setupDependsOn();
    }
    // if no enumeration supplied by the MetaAttribute then the options can be @Input() directly. See "SelectTwoControl"
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attribute'] && this.attribute?.enumeration && this.attribute.enumeration.length > 0) {
      this.options = this.attribute.enumeration;
    }
    if ((changes['cell'] || changes['formGroup']) && this.cell?.dependsOn) {
      this.setupDependsOn();
    }
  }

  setupDependsOn(): void {
    if (!this.cell?.dependsOn || !this.formGroup) {
      return;
    }

    if (this.dependsOnSubscription) {
      this.dependsOnSubscription.unsubscribe();
      this.dependsOnSubscription = undefined;
    }

    const control = this.getSourceControl();
    if(control) {
      this.dependsOnSubscription = control.valueChanges.subscribe((value) => {
        console.warn(`EnumerationControl: new dependent value; ${value}`, control);
        this.updateOptionList();
      });

      // pump once to initialise
      this.updateOptionList();
    }
    else {
      console.warn(`Unable to find control for ${this.cell.dependsOn}`);
    }
  }

  getSourceControl(): FormControlWithAttribute | null {
    if(this.cell && this.cell.dependsOn && this.formGroup) {
      const dependsOn = this.cell.dependsOn;
      return (this.formGroup.controls[dependsOn] ||
              this.formGroup.controls[`${dependsOn}_id`] ||
              this.formGroup.controls[`${dependsOn}_id`.toLowerCase()] ||
              this.formGroup.controls[`${dependsOn}Id`] ||
              this.formGroup.get(dependsOn) ||
              this.formGroup.get(`${dependsOn}_id`)) as FormControlWithAttribute || null;
    }
    else {
      return null;
    }
  }

  updateOptionList() {
    const control = this.getSourceControl();
    if(control) {
      let sourceEntityName: string | undefined = control.attribute?.relationshipTarget;
      if (!sourceEntityName && this.ctx?.metaEntity?.attributes) {
        const attr = this.ctx.metaEntity.attributes.find(a => a.name === this.cell.dependsOn);
        sourceEntityName = attr?.relationshipTarget;
      }
      if (!sourceEntityName && this.cell.dependsOn) {
        sourceEntityName = this.cell.dependsOn.charAt(0).toUpperCase() + this.cell.dependsOn.slice(1);
      }

      const rawVal = control.value;
      const id = typeof rawVal === 'object' && rawVal !== null ? rawVal.id : rawVal;

      if(sourceEntityName && id) {
        this.dataService.findById(sourceEntityName, id).subscribe({
          next: (sourceEntity: any) => {
            console.log('sourceEntity:', sourceEntity);
            this.options = [];
            const secondaryAttributeName = (this.cell as any)?.secondaryAttributeName ||
              (this.cell?.componentData as any)?.secondaryAttributeName ||
              'event_type_options';

            if(sourceEntity && sourceEntity[secondaryAttributeName]) {
              const valueList: string = sourceEntity[secondaryAttributeName];
              if(valueList) {
                this.options = valueList
                  .split(/[|,]/)
                  .map(value => value.trim())
                  .filter(value => value.length > 0);
              }
            }

            // blank the selectedOption if it does not exist in the list
            if(this.selectedOption && this.options.length > 0 && this.options.indexOf(this.selectedOption) < 0) {
              this.selectedOption = null;
              this.onChange(null);
            }
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('EnumerationControlComponent updateOptionList error:', err);
          }
        });
      } else {
        this.options = [];
        this.cdr.markForCheck();
      }
    }
  }

  isReadOnly() {
    return this.mode === 'view' || (this.isDataSource() && !this.isDataSourceEditable());
  }

  isDataSource() : boolean {
    if(this.cell && this.cell.attribute && this.cell.attribute) {
      return this.cell.attribute.name === 'data_source';
    }
    else {
      return false;
    }
  }

  isDataSourceEditable() {
    return this.stackConfig.dataSourceEditable;
  }

  set value(val: string){
    this.selectedOption = val;
    this.onChange(val);
    //this.onTouch(val)
  }

  onChange: any = () => {}
  onTouch: any = () => {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  writeValue(obj: any): void {
    this.selectedOption = obj ?? null;
    this.cdr.markForCheck();
  }

  get formControl(): FormControlWithAttribute | null {
    return this.ngControl.control instanceof FormControlWithAttribute ? this.ngControl.control : null;
  }

  get touched(): boolean {
    return this.formControl ? this.formControl.touchedSignal() : (this.ngControl.control?.touched ?? false);
  }

  hasErrors() {
    return this.formControl ? this.formControl.hasErrorsSignal() : (this.ngControl.errors !== null);
  }

  get validationResult() {
    return (this.formControl ? this.formControl.errorsSignal() : this.ngControl.errors) as ValidationResult;
  }

  onSelectOption(option: string) {
    this.value = option;
  }

  ngOnDestroy(): void {
    if (this.dependsOnSubscription) {
      this.dependsOnSubscription.unsubscribe();
      this.dependsOnSubscription = undefined;
    }
  }
}
