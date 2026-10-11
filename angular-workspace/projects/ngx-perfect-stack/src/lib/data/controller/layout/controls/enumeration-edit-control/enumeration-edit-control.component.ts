import { Component, Input, OnChanges, OnInit, Optional, Self, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';

@Component({
  selector: 'lib-enumeration-edit-control',
  templateUrl: './enumeration-edit-control.component.html',
  styleUrls: ['./enumeration-edit-control.component.css'],
  standalone: false,
})
export class EnumerationEditControlComponent implements OnInit, OnChanges, ControlValueAccessor {

  @Input()
  mode: string | null = 'edit';

  @Input()
  cell?: CellAttribute;

  @Input()
  options?: string | string[];

  predefinedOptions: string[] = [];
  selectedValues: string[] = [];
  disabled = false;

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.initOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['cell']) {
      this.initOptions();
    }
  }

  initOptions(): void {
    let raw: any = this.options;
    if (!raw && this.cell) {
      raw = (this.cell as any).options || this.cell.attribute?.enumeration;
    }

    if (Array.isArray(raw)) {
      this.predefinedOptions = raw.map((s) => String(s).trim()).filter((s) => s.length > 0);
    } else if (typeof raw === 'string') {
      this.predefinedOptions = this.parsePipeList(raw);
    } else {
      this.predefinedOptions = [];
    }
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

    // Fall back to comma if no pipe found
    return str
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  get availableOptions(): string[] {
    const selectedSet = new Set(this.selectedValues.map((v) => v.toLowerCase()));
    return this.predefinedOptions.filter((opt) => !selectedSet.has(opt.toLowerCase()));
  }

  addValue(val: string): void {
    if (this.disabled || this.mode === 'view') {
      return;
    }
    const trimmed = val.trim();
    if (!trimmed) {
      return;
    }

    const exists = this.selectedValues.some((v) => v.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      this.selectedValues = [...this.selectedValues, trimmed];
      this.emitValue();
    }
  }

  removeValue(index: number): void {
    if (this.disabled || this.mode === 'view') {
      return;
    }
    if (index >= 0 && index < this.selectedValues.length) {
      this.selectedValues = this.selectedValues.filter((_, i) => i !== index);
      this.emitValue();
    }
  }

  emitValue(): void {
    const outputString = this.selectedValues.join(' | ');
    this.onChange(outputString);
    this.onTouch();
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
  }

  writeValue(obj: any): void {
    if (typeof obj === 'string') {
      this.selectedValues = this.parsePipeList(obj);
    } else if (Array.isArray(obj)) {
      this.selectedValues = obj.map((s) => String(s).trim()).filter((s) => s.length > 0);
    } else {
      this.selectedValues = [];
    }
  }
}
