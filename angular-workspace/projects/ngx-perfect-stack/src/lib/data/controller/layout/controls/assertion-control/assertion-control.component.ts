import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
export class AssertionControlComponent implements OnInit {

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  mode: string | null = 'edit';

  @Input()
  ctx: FormContext;

  @Input()
  index: number;

  @Output()
  delete = new EventEmitter<number>();

  assertionType?: AssertionType;
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

  constructor(protected readonly assertionTypeService: AssertionTypeService) { }

  ngOnInit(): void {
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

  private initTypeDetails(): void {
    if (this.assertionType?.assertion_value_class) {
      this.valueClass = this.assertionType.assertion_value_class;
    } else {
      this.valueClass = AssertionValueClass.Text;
    }

    if (this.assertionType?.assertion_value_enum_options) {
      const raw = this.assertionType.assertion_value_enum_options.trim();
      if (raw.startsWith('[') && raw.endsWith(']')) {
        try {
          this.enumOptions = JSON.parse(raw);
        } catch {
          this.enumOptions = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
      } else {
        this.enumOptions = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    } else {
      this.enumOptions = [];
    }

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
