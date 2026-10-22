import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, Optional, Self } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormControlWithAttribute } from '../../../../data-edit/form-service/form.service';
import { ValidationResult } from '../../../../../domain/meta.rule';

@Component({
  selector: 'lib-enumeration-options-control',
  templateUrl: './enumeration-options-control.component.html',
  styleUrls: ['./enumeration-options-control.component.css'],
  standalone: false,
})
export class EnumerationOptionsControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string | null = 'edit';

  @Input()
  cell?: CellAttribute;

  optionsList: string[] = [];
  newOptionText = '';
  disabled = false;

  get formControl(): FormControlWithAttribute | null {
    return this.ngControl?.control instanceof FormControlWithAttribute ? this.ngControl.control : null;
  }

  get touched(): boolean {
    return this.formControl ? this.formControl.touchedSignal() : (this.ngControl?.control?.touched ?? false);
  }

  get name(): string {
    return this.cell?.attribute?.name || 'enumeration_options';
  }

  constructor(@Optional() @Self() public ngControl: NgControl, private cdr: ChangeDetectorRef) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {}

  isReadOnly(): boolean {
    return this.mode === 'view' || this.disabled;
  }

  parsePipeList(rawStr?: string | null): string[] {
    if (!rawStr) {
      return [];
    }
    const str = rawStr.trim();
    if (!str) {
      return [];
    }

    if (str.includes('|')) {
      return str
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    // Fall back to comma if no pipe found (e.g. legacy data)
    return str
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  addOption(): void {
    if (this.isReadOnly()) {
      return;
    }

    const raw = this.newOptionText?.trim();
    if (!raw) {
      return;
    }

    // Support paste / bulk input with pipe separator
    let itemsToAdd: string[] = [];
    if (raw.includes('|')) {
      itemsToAdd = raw
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else {
      itemsToAdd = [raw];
    }

    if (itemsToAdd.length > 0) {
      this.optionsList = [...this.optionsList, ...itemsToAdd];
      this.newOptionText = '';
      this.emitValue();
    }
  }

  removeOption(index: number): void {
    if (this.isReadOnly()) {
      return;
    }
    if (index >= 0 && index < this.optionsList.length) {
      this.optionsList = this.optionsList.filter((_, i) => i !== index);
      this.emitValue();
    }
  }

  moveOption(index: number, direction: -1 | 1): void {
    if (this.isReadOnly()) {
      return;
    }
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.optionsList.length) {
      return;
    }
    const updated = [...this.optionsList];
    const item = updated[index];
    updated.splice(index, 1);
    updated.splice(targetIndex, 0, item);
    this.optionsList = updated;
    this.emitValue();
  }

  emitValue(): void {
    const outputString = this.optionsList.join(' | ');
    this.onChange(outputString);
    this.onTouch();
    this.cdr.markForCheck();
  }

  // ControlValueAccessor methods
  onChange: any = () => {};
  onTouch: any = () => {};

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
    if (typeof obj === 'string') {
      this.optionsList = this.parsePipeList(obj);
    } else if (Array.isArray(obj)) {
      this.optionsList = obj.map((s) => String(s).trim()).filter((s) => s.length > 0);
    } else {
      this.optionsList = [];
    }
    this.cdr.markForCheck();
  }

  hasErrors(): boolean {
    return this.formControl ? this.formControl.hasErrorsSignal() : (this.ngControl?.errors !== null);
  }

  get validationResult(): ValidationResult {
    return (this.formControl ? this.formControl.errorsSignal() : this.ngControl?.errors) as ValidationResult;
  }

  ngOnDestroy(): void {}
}
