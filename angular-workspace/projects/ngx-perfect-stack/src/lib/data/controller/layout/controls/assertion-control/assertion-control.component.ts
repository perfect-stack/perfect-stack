import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnChanges, OnInit, Optional, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormGroup, UntypedFormGroup } from '@angular/forms';
import { DateTimeFormatter, LocalDate, LocalDateTime, ZonedDateTime, ZoneId } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import '@js-joda/timezone';
import { AssertionLayoutStyle, AssertionType, AssertionValueClass } from '../../../../../domain/assertion';
import { AttributeType, MetaAttribute, VisibilityType } from '../../../../../domain/meta.entity';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { AssertionTypeService } from '../../../../data-service/assertion-type.service';
import { NgxPerfectStackConfig, STACK_CONFIG } from '../../../../../ngx-perfect-stack-config';

@Component({
  selector: 'lib-assertion-control',
  templateUrl: './assertion-control.component.html',
  styleUrls: ['./assertion-control.component.css'],
  standalone: false
})
export class AssertionControlComponent implements OnInit, OnChanges {

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  mode: string | null = 'edit';

  @Input()
  ctx: FormContext;

  @Input()
  index: number;

  @Input()
  assertionType?: AssertionType;

  @Input()
  layoutStyle?: string;

  @Output()
  delete = new EventEmitter<number>();

  readonly inputId: string = 'assertion-ctrl-' + Math.random().toString(36).substring(2, 9);

  private _valueClass?: string;
  enumOptions: string[] = [];
  expanded: boolean = false;

  numericCell: CellAttribute;
  textCell: CellAttribute;
  dateAttribute: MetaAttribute;
  timeCell: CellAttribute;
  dateTimeCell: CellAttribute;
  geometryCell: CellAttribute;
  booleanAttribute: MetaAttribute;
  enumerationAttribute: MetaAttribute;
  enumerationCell: CellAttribute;

  constructor(
    protected readonly assertionTypeService: AssertionTypeService,
    protected readonly changeDetectorRef: ChangeDetectorRef,
    @Optional() @Inject(STACK_CONFIG) protected readonly stackConfig?: NgxPerfectStackConfig
  ) {
    Locale.getAvailableLocales();
  }

  ngOnInit(): void {
    this.checkAssertionType();

    this.formGroup?.get('assertion_type_id')?.valueChanges.subscribe(() => {
      this.checkAssertionType();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assertionType'] && !changes['assertionType'].firstChange) {
      this.initTypeDetails();
    }
    if (changes['formGroup'] && !changes['formGroup'].firstChange) {
      this.checkAssertionType();
    }
  }

  private checkAssertionType(): void {
    if (this.assertionType) {
      this.initTypeDetails();
      return;
    }

    const assertionTypeId = this.formGroup?.get('assertion_type_id')?.value;
    if (assertionTypeId) {
      const cached = this.assertionTypeService.getAssertionType(assertionTypeId);
      if (cached) {
        this.assertionType = cached;
        this.initTypeDetails();
        this.changeDetectorRef.markForCheck();
      } else {
        this.assertionTypeService.loadAssertionTypes().subscribe(() => {
          this.assertionType = this.assertionTypeService.getAssertionType(assertionTypeId);
          this.initTypeDetails();
          this.changeDetectorRef.markForCheck();
        });
      }
    } else {
      this.initTypeDetails();
    }
  }

  get resolvedAssertionType(): AssertionType | undefined {
    if (this.assertionType) {
      return this.assertionType;
    }
    const typeId = this.formGroup?.get('assertion_type_id')?.value;
    if (typeId) {
      const found = this.assertionTypeService.getAssertionType(typeId);
      if (found) {
        this.assertionType = found;
        this.initTypeDetails();
        return found;
      }
    }
    return undefined;
  }

  get effectiveValueClass(): string {
    const type = this.resolvedAssertionType;
    if (type?.assertion_value_class) {
      return String(type.assertion_value_class);
    }
    if (this.formGroup) {
      const num = this.formGroup.get('assertion_value_numeric')?.value;
      if (num !== null && num !== undefined && num !== '') {
        return AssertionValueClass.Double;
      }
      const dt = this.formGroup.get('assertion_value_date_time')?.value;
      if (dt !== null && dt !== undefined && dt !== '') {
        return AssertionValueClass.DateTime;
      }
      const d = this.formGroup.get('assertion_value_date')?.value;
      if (d !== null && d !== undefined && d !== '') {
        return AssertionValueClass.Date;
      }
      const t = this.formGroup.get('assertion_value_time')?.value;
      if (t !== null && t !== undefined && t !== '') {
        return AssertionValueClass.Time;
      }
      const b = this.formGroup.get('assertion_value_boolean')?.value;
      if (b !== null && b !== undefined && b !== '') {
        return AssertionValueClass.Boolean;
      }
      const geom = this.formGroup.get('assertion_value_geometry')?.value;
      if (geom !== null && geom !== undefined && geom !== '') {
        return AssertionValueClass.Geometry;
      }
      const txt = this.formGroup.get('assertion_value_text')?.value;
      if (txt !== null && txt !== undefined && txt !== '') {
        return AssertionValueClass.Text;
      }
    }
    return AssertionValueClass.Text;
  }

  get valueClass(): string {
    if (this._valueClass) {
      return this._valueClass;
    }
    return this.effectiveValueClass;
  }

  set valueClass(val: string) {
    this._valueClass = val;
  }

  get resolvedLayoutStyle(): string | undefined {
    if (this.layoutStyle) {
      return this.layoutStyle;
    }
    let current: AbstractControl | null = this.formGroup;
    while (current) {
      if (current instanceof FormGroup || current instanceof UntypedFormGroup) {
        const ctrl = current.get('layout_style');
        if (ctrl) {
          return ctrl.value || 'Card';
        }
      }
      current = current.parent;
    }
    return undefined;
  }

  get assertionTypeName(): string {
    return this.formGroup?.get('assertion_type_name')?.value ||
           this.resolvedAssertionType?.assertion_type_name ||
           'Fact';
  }

  get assertionUnit(): string {
    return this.formGroup?.get('assertion_unit')?.value ||
           this.resolvedAssertionType?.assertion_unit ||
           '';
  }

  formatDateTime(val?: string | null): string {
    if (!val) return '';
    try {
      const dateTimeFormat = this.stackConfig?.dateTimeFormat || 'dd-MMM-yyyy HH:mm';
      const dateTimeFormatter = DateTimeFormatter.ofPattern(dateTimeFormat).withLocale(Locale.US);
      const zoneId = ZoneId.of('Pacific/Auckland');

      try {
        let zonedDateTime = ZonedDateTime.parse(val);
        zonedDateTime = zonedDateTime.withZoneSameInstant(zoneId);
        return dateTimeFormatter.format(zonedDateTime);
      } catch {
        const localDateTime = LocalDateTime.parse(val);
        return dateTimeFormatter.format(localDateTime);
      }
    } catch {
      return val;
    }
  }

  formatDate(val?: string | null): string {
    if (!val) return '';
    try {
      const dateFormat = this.stackConfig?.dateFormat || 'dd-MMM-yyyy';
      const dateFormatter = DateTimeFormatter.ofPattern(dateFormat).withLocale(Locale.US);
      const localDate = LocalDate.parse(val.substring(0, 10));
      return dateFormatter.format(localDate);
    } catch {
      return val;
    }
  }

  get assertionValueDisplay(): string {
    if (!this.formGroup) return '';
    switch (this.valueClass) {
      case AssertionValueClass.Integer:
      case AssertionValueClass.Double: {
        const val = this.formGroup.get('assertion_value_numeric')?.value;
        return val !== null && val !== undefined && val !== '' ? String(val) : '';
      }
      case AssertionValueClass.Boolean: {
        const val = this.formGroup.get('assertion_value_boolean')?.value;
        if (val === true) return 'Yes';
        if (val === false) return 'No';
        return '';
      }
      case AssertionValueClass.Date: {
        return this.formatDate(this.formGroup.get('assertion_value_date')?.value);
      }
      case AssertionValueClass.Time: {
        return this.formGroup.get('assertion_value_time')?.value || '';
      }
      case AssertionValueClass.DateTime: {
        return this.formatDateTime(this.formGroup.get('assertion_value_date_time')?.value);
      }
      case AssertionValueClass.Geometry: {
        const geom = this.formGroup.get('assertion_value_geometry')?.value;
        if (!geom) return '';
        return typeof geom === 'object' ? JSON.stringify(geom) : String(geom);
      }
      case AssertionValueClass.Enumeration:
      case AssertionValueClass.Text:
      default: {
        const txt = this.formGroup.get('assertion_value_text')?.value;
        if (txt !== null && txt !== undefined && txt !== '') {
          return txt;
        }
        // Fallback: check if another control holds the actual value
        const num = this.formGroup.get('assertion_value_numeric')?.value;
        if (num !== null && num !== undefined && num !== '') {
          return String(num);
        }
        const dt = this.formGroup.get('assertion_value_date_time')?.value;
        if (dt !== null && dt !== undefined && dt !== '') {
          return this.formatDateTime(dt);
        }
        const d = this.formGroup.get('assertion_value_date')?.value;
        if (d !== null && d !== undefined && d !== '') {
          return this.formatDate(d);
        }
        const t = this.formGroup.get('assertion_value_time')?.value;
        if (t !== null && t !== undefined && t !== '') {
          return t;
        }
        const b = this.formGroup.get('assertion_value_boolean')?.value;
        if (b === true) return 'Yes';
        if (b === false) return 'No';
        return '';
      }
    }
  }

  toSentenceCase(val?: string | null): string {
    if (!val) return '';
    const trimmed = val.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  parseTokens(raw?: string | null): Set<string> {
    if (!raw) return new Set();
    return new Set(
      raw
        .split('|')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)
    );
  }

  isAttributeVisible(attr: 'value' | 'unit' | 'method' | 'accuracy' | 'notes'): boolean {
    const type = this.resolvedAssertionType;
    let configured: string | undefined;
    switch (this.resolvedLayoutStyle) {
      case AssertionLayoutStyle.Card:
      case 'Card':
        configured = type?.card_layout_attributes;
        if (!configured || !configured.trim()) {
          return true; // Default for Card: all 5 visible
        }
        break;
      case AssertionLayoutStyle.Field:
      case 'Field':
        configured = type?.field_layout_attributes;
        if (!configured || !configured.trim()) {
          return attr === 'value' || attr === 'unit'; // Default for Field: value, unit
        }
        break;
      case AssertionLayoutStyle.Table:
      case 'Table':
        configured = type?.table_layout_attributes;
        if (!configured || !configured.trim()) {
          return attr === 'value' || attr === 'unit'; // Default for Table: value, unit
        }
        break;
      default:
        return false;
    }

    const tokens = this.parseTokens(configured);
    return tokens.has(attr);
  }

  get hasSecondaryAttributesConfigured(): boolean {
    return this.isAttributeVisible('method') ||
           this.isAttributeVisible('accuracy') ||
           this.isAttributeVisible('notes');
  }

  get hasDetails(): boolean {
    const method = this.isAttributeVisible('method') && this.formGroup?.get('assertion_method')?.value;
    const accuracy = this.isAttributeVisible('accuracy') && this.formGroup?.get('assertion_accuracy')?.value;
    const notes = this.isAttributeVisible('notes') && this.formGroup?.get('assertion_notes')?.value;
    return Boolean((method && method.trim()) || (accuracy && accuracy.trim()) || (notes && notes.trim()));
  }

  toggleDetails(): void {
    this.expanded = !this.expanded;
  }

  onDelete(): void {
    this.delete.emit(this.index);
  }

  parseEnumOptions(rawOptions?: string | null): string[] {
    if (!rawOptions) {
      return [];
    }
    const raw = rawOptions.trim();
    if (!raw) {
      return [];
    }

    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => String(s).trim()).filter((s) => s.length > 0);
        }
      } catch {
        // Fall back to delimiter splitting below
      }
    }

    if (raw.includes('|')) {
      return raw
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private initTypeDetails(): void {
    const type = this.assertionType;
    if (type?.assertion_value_class) {
      this._valueClass = String(type.assertion_value_class);
    }

    this.enumOptions = this.parseEnumOptions(type?.assertion_value_enum_options);

    const scale = type?.assertion_value_decimal_places !== undefined
      ? String(type.assertion_value_decimal_places)
      : '';

    const numType = this.valueClass === AssertionValueClass.Integer
      ? AttributeType.Integer
      : AttributeType.Double;

    this.numericCell = this.createSyntheticCell('assertion_value_numeric', numType, scale);
    this.textCell = this.createSyntheticCell('assertion_value_text', AttributeType.Text);
    this.dateAttribute = this.createSyntheticAttribute('assertion_value_date', AttributeType.Date);
    this.timeCell = this.createSyntheticCell('assertion_value_time', AttributeType.Time);
    this.dateTimeCell = this.createSyntheticCell('assertion_value_date_time', AttributeType.DateTime);
    this.geometryCell = this.createSyntheticCell('assertion_value_geometry', AttributeType.Geometry);
    this.booleanAttribute = this.createSyntheticAttribute('assertion_value_boolean', AttributeType.Boolean);

    this.enumerationAttribute = this.createSyntheticAttribute('assertion_value_text', AttributeType.Enumeration);
    this.enumerationAttribute.enumeration = this.enumOptions;
    this.enumerationCell = this.createSyntheticCell('assertion_value_text', AttributeType.Enumeration);
    this.enumerationCell.attribute = this.enumerationAttribute;
  }

  private createSyntheticAttribute(name: string, type: AttributeType, scale = ''): MetaAttribute {
    return {
      name,
      label: this.assertionTypeName,
      description: '',
      type,
      visibility: VisibilityType.Visible,
      comparisonField: '',
      comparisonOperator: null as any,
      relationshipTarget: '',
      typeaheadSearch: [],
      discriminator: null as any,
      enumeration: [],
      unitOfMeasure: this.assertionUnit,
      scale,
      rules: [],
    } as unknown as MetaAttribute;
  }

  private createSyntheticCell(name: string, type: AttributeType, scale = ''): CellAttribute {
    const attribute = this.createSyntheticAttribute(name, type, scale);
    return {
      attributeName: name,
      attribute,
      metaEntity: null as any,
      component: '',
      labelLayout: null as any,
    } as unknown as CellAttribute;
  }
}
