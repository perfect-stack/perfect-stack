import {ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {AttributeType} from '../../../../../domain/meta.entity';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {ValidationResult} from '../../../../../domain/meta.rule';
import {convertDecimalUnit, getNextUnit, isSupportedUnit} from '../../../../../utils/unit-of-measure';

@Component({
    selector: 'lib-text-field-control',
    templateUrl: './text-field-control.component.html',
    styleUrls: ['./text-field-control.component.css'],
    standalone: false
})
export class TextFieldControlComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string;

  // @Input()
  // name: string;

  // @Input()
  // formGroup: FormGroup;

  @Input()
  cell: CellAttribute;

  @Input()
  idSuffix?: string | null;

  @Input()
  compact = false;

  @Input()
  inputId?: string | null;

  internalValue: any;

  disabled = false;

  selectedUnit = '';
  private lastDefaultUnit = '';
  private canonicalValue: any = '';

  get formControl(): FormControlWithAttribute | null {
    return this.ngControl.control instanceof FormControlWithAttribute ? this.ngControl.control : null;
  }

  get touched(): boolean {
    return this.formControl ? this.formControl.touchedSignal() : (this.ngControl.control?.touched ?? false);
  }

  constructor(public ngControl: NgControl, private cdr: ChangeDetectorRef) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    if(!this.formControl) {
      console.warn(`This component is NOT using a FormControlWithAttribute`);
    }
    this.syncDefaultUnit(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const modeChanged = Boolean(changes['mode'] && !changes['mode'].firstChange);
    const cellChanged = Boolean(changes['cell'] && !changes['cell'].firstChange);
    if (modeChanged || cellChanged) {
      const shouldResetToDefault =
        this.mode === 'view' ||
        Boolean(this.cell?.displayOnly) ||
        this.defaultUnit !== this.lastDefaultUnit;
      this.syncDefaultUnit(shouldResetToDefault);
    }
  }

  isReadOnly() {
    return this.mode === 'view' ? true : false;
  }

  get name() {
    return this.cell?.attribute?.name;
  }

  get componentId(): string {
    return this.name ? (this.idSuffix ? `${this.name}-${this.idSuffix}` : this.name) : '';
  }

  get resolvedInputId(): string {
    return this.inputId || this.componentId;
  }

  get uomElementId(): string {
    return this.resolvedInputId ? `${this.resolvedInputId}_uom` : 'uom';
  }

  get inputType() {
    return this.cell.attribute && this.cell.attribute.type === AttributeType.Integer ? 'number' : 'text';
  }

  get defaultUnit(): string {
    return this.cell?.attribute?.unitOfMeasure?.trim() || '';
  }

  get isUnitToggleEnabled(): boolean {
    return (
      this.mode !== 'view' &&
      !this.cell?.displayOnly &&
      this.cell?.attribute?.type === AttributeType.Double &&
      isSupportedUnit(this.defaultUnit)
    );
  }

  get activeUnit(): string {
    return this.isUnitToggleEnabled && this.selectedUnit ? this.selectedUnit : this.defaultUnit;
  }

  get isScaledUnitActive(): boolean {
    return this.isUnitToggleEnabled && Boolean(this.selectedUnit) && this.selectedUnit !== this.defaultUnit;
  }

  get effectiveScale(): string | undefined {
    if (this.isScaledUnitActive) {
      return undefined;
    }
    return this.cell?.attribute?.scale;
  }

  private syncDefaultUnit(resetToDefault: boolean): void {
    const nextDefault = this.defaultUnit;
    if (resetToDefault || nextDefault !== this.lastDefaultUnit) {
      this.lastDefaultUnit = nextDefault;
      this.selectedUnit = nextDefault;
      if (this.canonicalValue !== null && this.canonicalValue !== undefined && this.canonicalValue !== '') {
        this.internalValue = this.formatCanonicalForDisplay(this.canonicalValue);
        this.cdr.markForCheck();
      }
    }
  }

  onToggleUnit(): void {
    if (!this.isUnitToggleEnabled || this.disabled) {
      return;
    }

    const prevUnit = this.activeUnit || this.defaultUnit;
    const nextUnit = getNextUnit(prevUnit);
    if (!nextUnit) {
      return;
    }

    this.selectedUnit = nextUnit;

    if (this.internalValue !== null && this.internalValue !== undefined && String(this.internalValue).trim() !== '') {
      // When returning to the default unit, prefer the exact canonical value if it matches cleanly
      if (nextUnit === this.defaultUnit && this.canonicalValue !== null && this.canonicalValue !== undefined && String(this.canonicalValue).trim() !== '') {
        const canonicalStr = convertDecimalUnit(this.canonicalValue, this.defaultUnit, this.defaultUnit);
        if (canonicalStr !== null) {
          this.internalValue = canonicalStr;
          this.cdr.markForCheck();
          return;
        }
      }

      const converted = convertDecimalUnit(this.internalValue, prevUnit, nextUnit);
      if (converted !== null) {
        this.internalValue = converted;
      }
    }

    this.cdr.markForCheck();
  }

  set value(val: string) {
    // Reset any error messages now that the user has made a change in the UI
    if(this.ngControl.control && this.ngControl.errors) {
      this.ngControl.control.setErrors(null);
    }

    if (this.isScaledUnitActive) {
      this.internalValue = val;
      if (val === null || val === undefined || String(val).trim() === '') {
        this.canonicalValue = '';
        this.onChange('');
        return;
      }

      const converted = convertDecimalUnit(val, this.selectedUnit, this.defaultUnit);
      if (converted !== null) {
        this.canonicalValue = converted;
        this.onChange(converted);
      } else {
        this.canonicalValue = '';
        this.onChange('');
      }
      return;
    }

    let nextValue = val;
    if(this.cell && this.cell.attribute) {
      if(this.cell.attribute?.type === AttributeType.Double) {
        const scale = this.cell.attribute.scale;
        if (scale !== undefined && scale !== null && String(scale).trim() !== '' && !this.isPartialNumericInput(val)) {
          nextValue = this.changeScaleOfNumber(nextValue, scale, true);
        }
      }

      if(this.cell.attribute?.type === AttributeType.Integer) {
        nextValue = this.changeScaleOfNumber(nextValue, 0);
      }
    }

    this.internalValue = nextValue;
    this.canonicalValue = val;
    this.onChange(val);
    //this.onTouch(val)
  }

  private isPartialNumericInput(val: any): boolean {
    if (val === null || val === undefined) {
      return false;
    }
    const str = String(val);
    return str === '' || str === '-' || str === '.' || str === '-.' || str.endsWith('.');
  }

  private formatCanonicalForDisplay(obj: any): any {
    if (obj === null || obj === undefined || obj === '') {
      return '';
    }
    if (this.isScaledUnitActive) {
      const converted = convertDecimalUnit(obj, this.defaultUnit, this.selectedUnit);
      return converted !== null ? converted : String(obj);
    }

    let nextValue = obj;
    if (this.cell && this.cell.attribute) {
      if (this.cell.attribute?.type === AttributeType.Double) {
        const scale = this.cell.attribute.scale;
        if (scale !== undefined && scale !== null && String(scale).trim() !== '') {
          nextValue = this.changeScaleOfNumber(nextValue, scale);
        } else {
          const normalized = convertDecimalUnit(nextValue, '', '');
          if (normalized !== null) {
            nextValue = normalized;
          }
        }
      }
      if (this.cell.attribute?.type === AttributeType.Integer) {
        nextValue = this.changeScaleOfNumber(nextValue, 0);
      }
    }
    return nextValue;
  }

  changeScaleOfNumber(number: any, scale: any, preserveTrailingZeros = false) {

    // escape hatch for typing a negative number
    if(number === '-') {
      return number;
    }

    const currentScale = this.getScale(number);
    if(currentScale > Number(scale)) {
      return Number(number).toFixed(Number(scale)).toString();
    }
    else {
      if (preserveTrailingZeros) {
        return String(number);
      }
      return Number(number).toString();
    }
  }

  getScale(number: any) {
    const numberStr = String(number);
    const decimalPoint = numberStr.indexOf('.');
    return decimalPoint >= 0 ? numberStr.length - decimalPoint - 1 : 0;
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
    this.canonicalValue = obj ?? '';
    if (obj === null || obj === undefined || obj === '') {
      this.internalValue = '';
      this.cdr.markForCheck();
      return;
    }
    this.internalValue = this.formatCanonicalForDisplay(obj);
    this.cdr.markForCheck();
  }

  onModelChange(nextValue: any) {
    this.value = nextValue;
  }

  hasErrors() {
    return this.formControl ? this.formControl.hasErrorsSignal() : (this.ngControl.errors !== null);
  }

  get validationResult() {
    return (this.formControl ? this.formControl.errorsSignal() : this.ngControl.errors) as ValidationResult;
  }

  ngOnDestroy(): void {
  }
}
