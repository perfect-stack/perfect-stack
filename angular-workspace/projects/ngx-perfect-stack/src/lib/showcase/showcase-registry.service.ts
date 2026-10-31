import { Injectable } from '@angular/core';
import { AttributeType, ComparisonOperator, VisibilityType } from '../domain/meta.entity';
import { ShowcaseItem } from './showcase.model';

@Injectable({
  providedIn: 'root'
})
export class ShowcaseRegistryService {

  private readonly items: ShowcaseItem[] = [
    // -------------------------------------------------------------------------
    // CATEGORY: Inputs & Primitives
    // -------------------------------------------------------------------------
    {
      id: 'text-field',
      name: 'TextFieldControlComponent',
      selector: '<lib-text-field-control>',
      category: 'Inputs & Primitives',
      description: 'Universal text and numerical input widget. Renders an editable input with scale/UoM formatting and validation indicators in "edit" mode, or a formatted read-only span in "view" mode.',
      attribute: {
        name: 'sample_text',
        label: 'Sample Field',
        description: 'A demonstration attribute for TextFieldControl',
        type: AttributeType.Text,
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
        width: '6',
        height: '1',
        attributeName: 'sample_text',
        component: 'TextField',
      },
      initialValue: 'Fido',
      samplePresets: [
        { label: '"Max"', value: 'Max' },
        { label: '"Golden Retriever"', value: 'Golden Retriever' },
        { label: '"125.50"', value: '125.50' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Text, Integer, Double, Html' },
        { property: 'Accessor Behavior', description: 'Implements ControlValueAccessor, syncs with NgControl.' },
        { property: 'Edit Mode', description: 'Renders <input class="form-control"> with live scale formatting.' },
        { property: 'View Mode', description: 'Renders read-only <span> with UOM suffix or dash if empty.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'given_name', component: 'TextField' },
      featurePath: '/assets/features/components/text-field.feature',
      fallbackFeature: `Feature: Text Field Control Component\n  Scenario: Display and edit text in the Component Showcase`
    },
    {
      id: 'text-area',
      name: 'TextAreaControlComponent',
      selector: '<lib-text-area-control>',
      category: 'Inputs & Primitives',
      description: 'Multi-line rich text editor powered by TinyMCE in edit mode, rendering sanitized HTML or fallback plain text in view mode.',
      attribute: {
        name: 'sample_notes',
        label: 'Clinical Notes',
        description: 'Multi-line notes attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Visible,
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
        width: '12',
        height: '4',
        attributeName: 'sample_notes',
        component: 'TextArea',
      },
      initialValue: '<p>Patient exhibited normal vital signs. <strong>Follow up in 2 weeks.</strong></p>',
      samplePresets: [
        { label: 'Routine Exam', value: '<p>Routine exam completed. No concerns noted.</p>' },
        { label: 'Triage Note', value: '<p><strong>Priority 1:</strong> Immediate hydration required.</p>' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Text, Html' },
        { property: 'Height Calculation', description: 'Dynamically computes height from cell.height (cssHeight = 6 + (height-1)*3 + 1).' },
        { property: 'Edit Mode', description: 'Integrates TinyMCE rich editor (<editor>) with formatting toolbars.' },
        { property: 'View Mode', description: 'Renders sanitized [innerHTML] container.' }
      ],
      metaPageJson: { width: '12', height: '4', attributeName: 'notes', component: 'TextArea' },
      featurePath: '/assets/features/components/text-area.feature',
      fallbackFeature: `Feature: Text Area Control Component\n  Scenario: Display multi-line text in edit and view modes`
    },
    {
      id: 'boolean-checkbox',
      name: 'BooleanCheckBoxControlComponent',
      selector: '<lib-boolean-check-box-control>',
      category: 'Inputs & Primitives',
      description: 'Binary toggle control rendering an accessible HTML5 checkbox in edit mode, and human-friendly "Yes" / "No" text in view mode.',
      attribute: {
        name: 'is_active',
        label: 'Active Record',
        description: 'Boolean flag attribute',
        type: AttributeType.Boolean,
        visibility: VisibilityType.Visible,
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
        attributeName: 'is_active',
        component: 'Boolean',
      },
      initialValue: true,
      samplePresets: [
        { label: 'True / Yes', value: true },
        { label: 'False / No', value: false }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Boolean' },
        { property: 'Label Toggle', description: 'Supports hideLabel input / cell.hideLabel configuration for table layouts.' },
        { property: 'Edit Mode', description: 'Renders standard Bootstrap <input type="checkbox" class="form-check-input">.' },
        { property: 'View Mode', description: 'Outputs localized "Yes" or "No" display value.' }
      ],
      metaPageJson: { width: '4', height: '1', attributeName: 'is_active', component: 'Boolean' },
      featurePath: '/assets/features/components/boolean-checkbox.feature',
      fallbackFeature: `Feature: Boolean Checkbox Control Component\n  Scenario: Toggle checkbox and inspect view mode`
    },
    {
      id: 'url-field',
      name: 'UrlFieldControlComponent',
      selector: '<lib-url-field-control>',
      category: 'Inputs & Primitives',
      description: 'Web hyperlink input rendering an interactive text box in edit mode, and a secure clickable hyperlink with an external link indicator in view mode.',
      attribute: {
        name: 'website_url',
        label: 'Website Link',
        description: 'Hyperlink URL attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Visible,
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
        width: '6',
        height: '1',
        attributeName: 'website_url',
        component: 'Url',
      },
      initialValue: 'https://perfect-stack.org',
      samplePresets: [
        { label: 'Perfect-Stack', value: 'https://perfect-stack.org' },
        { label: 'Angular Dev', value: 'https://angular.dev' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Url, Text' },
        { property: 'Edit Mode', description: 'Renders <input type="url" class="form-control">.' },
        { property: 'View Mode', description: 'Renders clickable <a target="_blank" rel="noopener"> link.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'website_url', component: 'Url' },
      featurePath: '/assets/features/components/url-field.feature',
      fallbackFeature: `Feature: URL Field Control Component\n  Scenario: Edit URL and inspect clickable link in view mode`
    },

    // -------------------------------------------------------------------------
    // CATEGORY: Pickers & Calendars
    // -------------------------------------------------------------------------
    {
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
      fallbackFeature: `Feature: Date Picker Control Component\n  Scenario: Display and inspect date picker in edit and view modes`
    },
    {
      id: 'date-time',
      name: 'DateTimeControlComponent',
      selector: '<lib-date-time-control>',
      category: 'Pickers & Calendars',
      description: 'Combined date and time selector for timestamps with timezone-aware ISO serialization.',
      attribute: {
        name: 'appointment_time',
        label: 'Appointment Time',
        description: 'Timestamp attribute with date and time',
        type: AttributeType.DateTime,
        visibility: VisibilityType.Visible,
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
        width: '6',
        height: '1',
        attributeName: 'appointment_time',
        component: 'DateTime',
      },
      initialValue: '2026-11-01T14:30:00',
      samplePresets: [
        { label: 'Afternoon (14:30)', value: '2026-11-01T14:30:00' },
        { label: 'Morning (09:00)', value: '2026-11-01T09:00:00' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'DateTime' },
        { property: 'Timezone Handling', description: 'Leverages @js-joda/timezone and ClientConfig DATE_FORMAT.' },
        { property: 'Edit Mode', description: 'Twin controls for calendar date selection and time picker.' },
        { property: 'View Mode', description: 'Unified formatted date-time string.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'appointment_time', component: 'DateTime' },
      featurePath: '/assets/features/components/date-time.feature',
      fallbackFeature: `Feature: Date Time Control Component\n  Scenario: Display date time in edit and view modes`
    },
    {
      id: 'time-control',
      name: 'TimeControlComponent',
      selector: '<lib-time-control>',
      category: 'Pickers & Calendars',
      description: 'Discrete time picker for hours, minutes, and AM/PM selection without calendar dependencies.',
      attribute: {
        name: 'observation_time',
        label: 'Observation Time',
        description: 'Standalone time attribute',
        type: AttributeType.Time,
        visibility: VisibilityType.Visible,
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
        attributeName: 'observation_time',
        component: 'Time',
      },
      initialValue: '14:30:00',
      samplePresets: [
        { label: '09:00 AM', value: '09:00:00' },
        { label: '02:30 PM', value: '14:30:00' },
        { label: '06:45 PM', value: '18:45:00' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Time' },
        { property: 'Formatting', description: 'Formats LocalTime using JS-Joda.' },
        { property: 'Edit Mode', description: 'Renders custom hour/minute selector input.' },
        { property: 'View Mode', description: 'Formatted time string (e.g. 2:30 PM).' }
      ],
      metaPageJson: { width: '4', height: '1', attributeName: 'observation_time', component: 'Time' },
      featurePath: '/assets/features/components/time-control.feature',
      fallbackFeature: `Feature: Time Control Component\n  Scenario: Display time in edit and view modes`
    },
    {
      id: 'colour-band',
      name: 'ColourBandComponent',
      selector: '<lib-colour-band-component>',
      category: 'Pickers & Calendars',
      description: 'Interactive color picker and palette selector with modal picker dialog for physical bands, markers, or status colors.',
      attribute: {
        name: 'colour_band',
        label: 'Marker Colour',
        description: 'Hex or named color attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Visible,
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
        attributeName: 'colour_band',
        component: 'ColourBand',
      },
      initialValue: '#42A948',
      samplePresets: [
        { label: 'Green (#42A948)', value: '#42A948' },
        { label: 'Blue (#3B82F6)', value: '#3B82F6' },
        { label: 'Red (#EF4444)', value: '#EF4444' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Text, Colour' },
        { property: 'Modal Dialog', description: 'Opens ColourBandDialogComponent via NgbModal.' },
        { property: 'Edit Mode', description: 'Color preview square + hex code input with click-to-pick modal.' },
        { property: 'View Mode', description: 'Color swatch indicator box next to color value.' }
      ],
      metaPageJson: { width: '4', height: '1', attributeName: 'colour_band', component: 'ColourBand' },
      featurePath: '/assets/features/components/colour-band.feature',
      fallbackFeature: `Feature: Colour Band Control Component\n  Scenario: Display color band in edit and view modes`
    }
  ];

  getItems(): ShowcaseItem[] {
    return this.items;
  }

  getCategories(): string[] {
    return Array.from(new Set(this.items.map(i => i.category)));
  }

  getItemsByCategory(category: string): ShowcaseItem[] {
    return this.items.filter(i => i.category === category);
  }

  getItem(id: string): ShowcaseItem | undefined {
    return this.items.find(i => i.id === id);
  }
}
