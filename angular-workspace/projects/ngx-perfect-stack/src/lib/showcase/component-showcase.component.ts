import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormGroup, Validators } from '@angular/forms';
import { AttributeType, ComparisonOperator, MetaAttribute, VisibilityType } from '../domain/meta.entity';
import { CellAttribute } from '../meta/page/meta-page-service/meta-page.service';
import { FormControlWithAttribute } from '../data/data-edit/form-service/form.service';
import { ResultType, ValidationResult } from '../domain/meta.rule';

export interface ShowcaseItem {
  id: string;
  name: string;
  selector: string;
  category: string;
  description: string;
}

@Component({
  selector: 'lib-component-showcase',
  templateUrl: './component-showcase.component.html',
  styleUrls: ['./component-showcase.component.scss'],
  standalone: false
})
export class ComponentShowcaseComponent implements OnInit {

  components: ShowcaseItem[] = [
    {
      id: 'text-field',
      name: 'TextFieldControlComponent',
      selector: '<lib-text-field-control>',
      category: 'Inputs & Primitives',
      description: 'Universal text and numerical input widget. Renders an editable input with scale/UoM formatting and validation indicators in "edit" mode, or a formatted read-only span in "view" mode.'
    },
    {
      id: 'text-area',
      name: 'TextAreaControlComponent',
      selector: '<lib-text-area-control>',
      category: 'Inputs & Primitives',
      description: 'Multi-line text area input with custom height and line wrap support.'
    },
    {
      id: 'date-picker',
      name: 'DatePickerControlComponent',
      selector: '<app-date-picker-control>',
      category: 'Pickers & Calendars',
      description: 'Integrated NgbDatePicker input handling ISO-8601 string dates with calendar dropdown.'
    },
    {
      id: 'boolean-checkbox',
      name: 'BooleanCheckBoxControlComponent',
      selector: '<lib-boolean-check-box-control>',
      category: 'Inputs & Primitives',
      description: 'Accessible boolean toggle checkbox with configurable label positioning.'
    }
  ];

  selectedComponentId = 'text-field';
  activeTab: 'playground' | 'docs' | 'gherkin' = 'playground';

  // Component Workbench State
  mode: 'edit' | 'view' = 'edit';
  idSuffix: string | null = null;
  isDisabled = false;

  attribute: MetaAttribute = {
    name: 'sample_text',
    label: 'Sample Field',
    description: 'A demonstration attribute for TextFieldControl',
    type: AttributeType.Text,
    visibility: VisibilityType.Required,
    comparisonField: '',
    comparisonOperator: ComparisonOperator.Equals,
    relationshipTarget: '',
    typeaheadSearch: [],
    discriminator: {
      entityMappingList: [],
      discriminatorName: '',
      discriminatorType: ''
    },
    rules: [],
    enumeration: [],
    unitOfMeasure: '',
    scale: '',
  };

  cell: CellAttribute = {
    width: '6',
    height: '1',
    attributeName: 'sample_text',
    component: 'TextField',
    attribute: this.attribute,
  };

  formGroup: UntypedFormGroup;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.initForm('Fido');

    this.route.params.subscribe(params => {
      if (params['componentId'] && this.components.some(c => c.id === params['componentId'])) {
        this.selectedComponentId = params['componentId'];
      }
    });
  }

  get activeComponent(): ShowcaseItem {
    return this.components.find(c => c.id === this.selectedComponentId) || this.components[0];
  }

  get control(): FormControlWithAttribute {
    return this.formGroup.controls[this.attribute.name] as FormControlWithAttribute;
  }

  initForm(initialValue: string): void {
    const ctrl = new FormControlWithAttribute(initialValue);
    ctrl.attribute = this.attribute;
    this.formGroup = new UntypedFormGroup({
      [this.attribute.name]: ctrl
    });
  }

  selectComponent(id: string): void {
    this.selectedComponentId = id;
    this.router.navigate(['/showcase', id]);
  }

  setMode(mode: 'edit' | 'view'): void {
    this.mode = mode;
  }

  toggleDisabled(): void {
    this.isDisabled = !this.isDisabled;
    if (this.isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

  toggleTouched(): void {
    if (this.control.touched) {
      this.control.markAsPristine();
      this.control.markAsUntouched();
      if (this.control.touchedSignal) {
        this.control.touchedSignal.set(false);
      }
    } else {
      this.control.markAsTouched();
    }
  }

  triggerValidationError(): void {
    const validationResult: ValidationResult = {
      name: this.attribute.name,
      resultType: ResultType.Error,
      message: 'Attribute required'
    };
    this.control.setErrors(validationResult as any);
    this.control.markAsTouched();
  }

  clearErrors(): void {
    this.control.setErrors(null);
  }

  setSampleValue(val: string): void {
    this.control.setValue(val);
  }

  updateUom(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.attribute.unitOfMeasure = input.value;
  }

  updateScale(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.attribute.scale = input.value;
    if (input.value && Number(input.value) > 0) {
      this.attribute.type = AttributeType.Double;
    } else {
      this.attribute.type = AttributeType.Text;
    }
  }

  updateIdSuffix(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.idSuffix = input.value.trim() ? input.value.trim() : null;
  }
}
