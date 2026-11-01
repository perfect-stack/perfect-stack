import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Pickers & Calendars
// -------------------------------------------------------------------------
export const datePickerRegistration: ShowcaseItem = {
      id: 'date-picker',
      name: 'DatePickerControlComponent',
      selector: '<app-date-picker-control>',
      category: 'Pickers & Calendars',
      description: 'Calendar date picker integrating ng-bootstrap NgbInputDatepicker with JS-Joda ISO date conversions and custom localized formats.',
      attribute: {
        name: 'birth_date',
        label: 'Birth Date',
        description: 'Calendar date attribute',
        type: AttributeType.Date,
        visibility: VisibilityType.Required,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        relationshipTarget: '',
        typeaheadSearch: [],
        discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
        rules: [],
        enumeration: [],
        unitOfMeasure: '',
        scale: '',
      },
      cell: {
        width: '4',
        height: '1',
        attributeName: 'birth_date',
        component: 'DatePicker',
      },
      initialValue: '2026-11-01',
      samplePresets: [
        { label: 'Today (2026-11-01)', value: '2026-11-01' },
        { label: 'Mid-Year (2025-06-15)', value: '2025-06-15' },
        { label: 'Past (2020-01-01)', value: '2020-01-01' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Date' },
        { property: 'Adapter Engine', description: 'Uses CustomDateAdapterService & CustomDateParserFormatter for JS-Joda formatting.' },
        { property: 'Edit Mode', description: 'Renders <input ngbDatepicker> with calendar toggle button.' },
        { property: 'View Mode', description: 'Formats date into client config display format (e.g. dd-MMM-yyyy).' }
      ],
      metaPageJson: { width: '4', height: '1', attributeName: 'birth_date', component: 'DatePicker' },
      featurePath: '/assets/features/components/date-picker.feature',
      fallbackFeature: `Feature: Date Picker Control Component
  As a user recording calendar dates
  I want an intuitive date picker with calendar popup and localized formatting
  So that dates can be selected easily without formatting errors

  Scenario: Display and inspect date picker in edit and view modes
    When I navigate to "/showcase/date-picker"
    Then the showcase header should display "DatePickerControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the date picker view should display formatted date "01-Nov-2026"
    When I click the showcase button "btn-mode-edit"
    Then the date picker input should contain "01-Nov-2026"`
    };
