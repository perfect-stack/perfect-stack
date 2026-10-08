import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { AssertionType, AssertionValueClass } from '../../../../../domain/assertion';
import { AttributeType, MetaAttribute, VisibilityType } from '../../../../../domain/meta.entity';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { AssertionTypeService } from '../../../../data-service/assertion-type.service';

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

  @Output()
  delete = new EventEmitter<number>();

  valueClass: string = AssertionValueClass.Text;
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

  constructor(protected readonly assertionTypeService: AssertionTypeService) { }

  ngOnInit(): void {
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
      } else {
        this.assertionTypeService.loadAssertionTypes().subscribe(() => {
          this.assertionType = this.assertionTypeService.getAssertionType(assertionTypeId);
          this.initTypeDetails();
        });
      }
    } else {
      this.initTypeDetails();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assertionType'] && !changes['assertionType'].firstChange) {
      this.initTypeDetails();
    }
  }

  get assertionTypeName(): string {
    return this.formGroup?.get('assertion_type_name')?.value ||
           this.assertionType?.assertion_type_name ||
           'Fact';
  }

  get assertionUnit(): string {
    return this.formGroup?.get('assertion_unit')?.value ||
           this.assertionType?.assertion_unit ||
           '';
  }

  get hasDetails(): boolean {
    const method = this.formGroup?.get('assertion_method')?.value;
    const accuracy = this.formGroup?.get('assertion_accuracy')?.value;
    const notes = this.formGroup?.get('assertion_notes')?.value;
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

    // Support pipe-separated (e.g. "Female | Male | Hermaphrodite | Undetermined")
    if (raw.includes('|')) {
      return raw
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    // Fall back to comma-separated
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private initTypeDetails(): void {
    if (this.assertionType?.assertion_value_class) {
      this.valueClass = this.assertionType.assertion_value_class;
    } else {
      this.valueClass = AssertionValueClass.Text;
    }

    this.enumOptions = this.parseEnumOptions(this.assertionType?.assertion_value_enum_options);

    const scale = this.assertionType?.assertion_value_decimal_places !== undefined
      ? String(this.assertionType.assertion_value_decimal_places)
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
