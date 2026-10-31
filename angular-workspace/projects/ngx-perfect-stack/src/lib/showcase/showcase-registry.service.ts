import { Injectable } from '@angular/core';
import { AttributeType, ComparisonOperator, VisibilityType } from '../domain/meta.entity';
import { ShowcaseItem } from './showcase.model';
import { ActionType } from '../domain/meta.role';
import { ToolType } from '../domain/meta.page';

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
      fallbackFeature: `Feature: Text Field Control Component
  As a developer and user of ngx-perfect-stack
  I want a versatile text field component that adapts to edit and view modes and provides validation feedback
  So that users can enter and inspect text data reliably

  Scenario: Display and edit text in the Component Showcase
    When I navigate to "/showcase/text-field"
    Then the showcase header should display "TextFieldControlComponent"
    And the text field input should contain "Fido"
    When I enter "Rex" into the text field input
    Then the text field input should contain "Rex"
    And the form state inspector should show value "Rex"

  Scenario: Switching between edit and view modes
    When I navigate to "/showcase/text-field"
    When I click the showcase button "btn-mode-view"
    Then the text field should display read-only text "Fido"
    When I click the showcase button "btn-mode-edit"
    Then the text field input should contain "Fido"

  Scenario: Validation error appearance and clearance
    When I navigate to "/showcase/text-field"
    When I click the showcase button "btn-trigger-error"
    Then the text field should show validation error styling
    And the text field should display validation message "Attribute required"
    And the form state inspector status should be "INVALID"
    When I click the showcase button "btn-clear-error"
    Then the text field should not show validation error styling
    And the form state inspector status should be "VALID"`
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
      fallbackFeature: `Feature: Text Area Control Component
  As a user writing extensive notes or descriptions
  I want a multi-line text area component that supports editing and formatted viewing
  So that longer text and rich formatting can be captured and reviewed comfortably

  Scenario: Display multi-line text in edit and view modes
    When I navigate to "/showcase/text-area"
    Then the showcase header should display "TextAreaControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the text area should display formatted view text
    When I click the showcase button "btn-mode-edit"
    Then the text area editor should be visible`
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
      fallbackFeature: `Feature: Boolean Checkbox Control Component
  As a user filling out a form with toggle options
  I want a checkbox control that clearly indicates Yes/No states in edit and view modes
  So that binary flags are unambiguous to users

  Scenario: Toggle checkbox and inspect view mode
    When I navigate to "/showcase/boolean-checkbox"
    Then the showcase header should display "BooleanCheckBoxControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the boolean checkbox view should display "Yes"
    When I click the showcase button "btn-mode-edit"
    Then the checkbox element should be visible and checked`
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
      fallbackFeature: `Feature: URL Field Control Component
  As a user managing web references and external links
  I want a dedicated URL field component that renders editable text in edit mode and clickable hyperlinks in view mode
  So that links can be directly navigated and checked

  Scenario: Edit URL and inspect clickable link in view mode
    When I navigate to "/showcase/url-field"
    Then the showcase header should display "UrlFieldControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the URL view link should be visible with text "https://perfect-stack.org"
    When I click the showcase button "btn-mode-edit"
    Then the URL input should be editable and contain "https://perfect-stack.org"`
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
      fallbackFeature: `Feature: Date Time Control Component
  As a user scheduling visits or recording timestamped observations
  I want a combined date and time picker that handles calendar selection and time of day
  So that timestamps are accurately represented in ISO-8601 format

  Scenario: Display date time in edit and view modes
    When I navigate to "/showcase/date-time"
    Then the showcase header should display "DateTimeControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the date time view should display formatted date and time
    When I click the showcase button "btn-mode-edit"
    Then the date time input should be visible`
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
      fallbackFeature: `Feature: Time Control Component
  As a user recording observation times and appointment hours
  I want a dedicated time picker with hours and minutes selection
  So that times can be specified cleanly without requiring a full date

  Scenario: Display time in edit and view modes
    When I navigate to "/showcase/time-control"
    Then the showcase header should display "TimeControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the time control view should display formatted time
    When I click the showcase button "btn-mode-edit"
    Then the time input should be visible`
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
      fallbackFeature: `Feature: Colour Band Control Component
  As a field researcher or clinic manager
  I want a visual color band selector to tag and identify categories or physical markers
  So that color combinations are visually distinguishable in both edit and view modes

  Scenario: Display color band in edit and view modes
    When I navigate to "/showcase/colour-band"
    Then the showcase header should display "ColourBandComponent"
    When I click the showcase button "btn-mode-view"
    Then the color band view should display the active color swatch
    When I click the showcase button "btn-mode-edit"
    Then the color band interactive input should be visible`
    },
    {
      id: 'flexible-date-time',
      name: 'FlexibleDateTimeControlComponent',
      selector: '<lib-flexible-date-time-control>',
      category: 'Pickers & Calendars',
      description: 'Dual date and time selector with fuzzy approximate time buttons ("Day", "Night", "Unknown") that sets both an ISO timestamp and a secondary precision attribute.',
      attribute: {
        name: 'occurred_at',
        label: 'Observation Date & Time',
        description: 'Timestamp for observation or occurrence',
        type: AttributeType.DateTime,
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
        width: '12',
        height: '1',
        attributeName: 'occurred_at',
        component: 'FlexibleDateTime',
        componentData: {
          secondaryAttributeName: 'time_precision'
        }
      },
      initialValue: '2026-05-18T10:30:00.000Z',
      samplePresets: [
        { label: 'Morning (10:30)', value: '2026-05-18T10:30:00.000Z' },
        { label: 'Afternoon (15:00)', value: '2026-05-18T15:00:00.000Z' },
        { label: 'Evening (20:00)', value: '2026-05-18T20:00:00.000Z' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'DateTime (with optional secondary string precision field)' },
        { property: 'Fuzzy Presets', description: 'Quick-select buttons for "Day" (12:00), "Night" (23:59), "Unknown" (00:00).' },
        { property: 'Secondary Attribute', description: 'Tracks precision mode (e.g. Exact, Day, Night, Unknown) via cell.componentData.secondaryAttributeName.' },
        { property: 'View Mode', description: 'Renders formatted datetime string along with precision badge.' }
      ],
      metaPageJson: {
        width: '12',
        height: '1',
        attributeName: 'occurred_at',
        component: 'FlexibleDateTime',
        componentData: { secondaryAttributeName: 'time_precision' }
      },
      featurePath: '/assets/features/components/flexible-date-time.feature',
      fallbackFeature: `Feature: Flexible Date Time Control Component
  As a clinician recording observations with uncertain or approximate times
  I want a flexible datetime picker with fuzzy quick-select buttons like Day, Night, and Unknown
  So that timestamps can be recorded accurately or approximately without failing validation

  @showcase @flexible-date-time
  Scenario: Display flexible date time and toggle approximate time presets
    When I navigate to "/showcase/flexible-date-time"
    Then the showcase header should display "FlexibleDateTimeControlComponent"
    And the flexible date time picker inputs should be visible
    When I click the showcase button "btn-time-day"
    Then the form state inspector should show value "2026-05-18"
    When I click the showcase button "btn-mode-view"
    Then the flexible date time view should display formatted value
    When I click the showcase button "btn-mode-edit"
    Then the flexible date time picker inputs should be visible`
    },

    // -------------------------------------------------------------------------
    // CATEGORY: Selections & Badges
    // -------------------------------------------------------------------------
    {
      id: 'enumeration-control',
      name: 'EnumerationControlComponent',
      selector: '<lib-enumeration-control>',
      category: 'Selections & Badges',
      description: 'Single-select dropdown widget populated from an enumerated list of choices. Renders a Bootstrap <select class="form-select"> in edit mode, and a read-only input in view mode.',
      attribute: {
        name: 'species_classification',
        label: 'Species Classification',
        description: 'Taxonomic class of animal',
        type: AttributeType.Enumeration,
        visibility: VisibilityType.Required,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        relationshipTarget: '',
        typeaheadSearch: [],
        discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
        rules: [],
        enumeration: ['Canine', 'Feline', 'Equine', 'Avian', 'Reptile'],
        unitOfMeasure: '',
        scale: '',
      },
      cell: {
        width: '6',
        height: '1',
        attributeName: 'species_classification',
        component: 'Enumeration',
      },
      initialValue: 'Canine',
      samplePresets: [
        { label: 'Canine', value: 'Canine' },
        { label: 'Feline', value: 'Feline' },
        { label: 'Avian', value: 'Avian' },
        { label: 'Clear', value: null }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Enumeration, Text' },
        { property: 'Options Source', description: 'Loaded from attribute.enumeration or dependent query via cell.dependsOn.' },
        { property: 'Edit Mode', description: 'Renders <select class="form-select"> with options from attribute.enumeration and blank null option.' },
        { property: 'View Mode', description: 'Renders read-only input showing selected value or &mdash; if empty.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'species_classification', component: 'Enumeration' },
      featurePath: '/assets/features/components/enumeration-control.feature',
      fallbackFeature: `Feature: Enumeration Control Component
  As a veterinary staff member or researcher
  I want a dropdown selector populated with defined enumeration choices
  So that data input is standardized and validated against allowed values

  Scenario: Display and select enumeration options in edit and view modes
    When I navigate to "/showcase/enumeration-control"
    Then the showcase header should display "EnumerationControlComponent"
    And the enumeration select should contain option "Canine"
    And the enumeration select should contain option "Feline"
    When I select "Feline" in the enumeration dropdown
    Then the form state inspector should show value "Feline"
    When I click the showcase button "btn-mode-view"
    Then the enumeration view should display "Feline"
    When I click the showcase button "btn-mode-edit"
    Then the enumeration select should contain option "Avian"`
    },
    {
      id: 'pipe-list',
      name: 'PipeListControlComponent',
      selector: '<lib-pipe-list-control>',
      category: 'Selections & Badges',
      description: 'Multi-tag token selector storing selections as a pipe-delimited string (e.g. "Urgent|Surgery"). Displays active badges with remove icons and clickable pill buttons for available options in edit mode, and read-only badges in view mode.',
      attribute: {
        name: 'procedure_tags',
        label: 'Procedure Tags',
        description: 'Pipe-delimited set of clinical procedure tags',
        type: AttributeType.Text,
        visibility: VisibilityType.Visible,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        relationshipTarget: '',
        typeaheadSearch: [],
        discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
        rules: [],
        enumeration: ['Urgent', 'Surgery', 'Consultation', 'Follow-up', 'Vaccination'],
        unitOfMeasure: '',
        scale: '',
      },
      cell: {
        width: '8',
        height: '1',
        attributeName: 'procedure_tags',
        component: 'PipeList',
      },
      initialValue: 'Urgent|Surgery',
      samplePresets: [
        { label: 'Urgent + Surgery', value: 'Urgent|Surgery' },
        { label: 'Consultation + Follow-up', value: 'Consultation|Follow-up' },
        { label: 'All Tags', value: 'Urgent|Surgery|Consultation|Follow-up|Vaccination' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Text (pipe-delimited string "A|B|C")' },
        { property: 'Options Source', description: 'Parsed from options property, cell.options, or cell.attribute.enumeration.' },
        { property: 'Edit Mode', description: 'Removable badges with close icon plus quick-add buttons for available tags.' },
        { property: 'View Mode', description: 'Read-only badges for selected tags or &mdash; if empty.' }
      ],
      metaPageJson: { width: '8', height: '1', attributeName: 'procedure_tags', component: 'PipeList' },
      featurePath: '/assets/features/components/pipe-list.feature',
      fallbackFeature: `Feature: Pipe List Control Component
  As a veterinary clinician
  I want to select multiple tags stored as a pipe-delimited string
  So that complex categorizations can be tagged and untagged interactively

  Scenario: Add and remove pipe-delimited tags in edit and view modes
    When I navigate to "/showcase/pipe-list"
    Then the showcase header should display "PipeListControlComponent"
    And the pipe list should contain selected tag "Urgent"
    And the pipe list should contain selected tag "Surgery"
    When I add tag "Vaccination" to the pipe list
    Then the pipe list should contain selected tag "Vaccination"
    Then the form state inspector should show value "Urgent|Surgery|Vaccination"
    When I click the showcase button "btn-mode-view"
    Then the pipe list view should contain tag "Urgent"
    And the pipe list view should contain tag "Vaccination"
    When I click the showcase button "btn-mode-edit"
    When I remove tag "Urgent" from the pipe list
    Then the form state inspector should show value "Surgery|Vaccination"`
    },
    {
      id: 'badge-list',
      name: 'BadgeListComponent',
      selector: '<lib-badge-list>',
      category: 'Selections & Badges',
      description: 'Read-only badge cluster widget that parses comma-delimited strings (e.g. "Vaccinated, Microchipped, Insured") into styled Bootstrap badges.',
      attribute: {
        name: 'pet_badges',
        label: 'Health & Status Badges',
        description: 'Comma-delimited status tags',
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
        attributeName: 'pet_badges',
        component: 'BadgeList',
      },
      initialValue: 'Vaccinated, Microchipped, Insured',
      samplePresets: [
        { label: 'Vaccinated & Insured', value: 'Vaccinated, Insured' },
        { label: 'All Badges', value: 'Vaccinated, Microchipped, Insured, Neutered' },
        { label: 'Quarantine', value: 'Quarantine, Isolation' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Text (comma-separated string)' },
        { property: 'Delimiter', description: 'Splits value by comma into individual badges.' },
        { property: 'Styling', description: 'Renders <div class="badge bg-secondary me-2"> for each badge.' },
        { property: 'Display Only', description: 'Displays badges across both edit and view modes.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'pet_badges', component: 'BadgeList' },
      featurePath: '/assets/features/components/badge-list.feature',
      fallbackFeature: `Feature: Badge List Component
  As a veterinary receptionist or nurse
  I want to view prominent badges summarizing pet status flags
  So that critical patient flags like vaccination or insurance status are immediately visible

  Scenario: Display comma-separated status badges in the Component Showcase
    When I navigate to "/showcase/badge-list"
    Then the showcase header should display "BadgeListComponent"
    And the badge list should display badge "Vaccinated"
    And the badge list should display badge "Microchipped"
    And the badge list should display badge "Insured"
    And the badge list should have 3 badges
    When I click the showcase button "btn-mode-view"
    Then the badge list should display badge "Vaccinated"`
    },
    {
      id: 'select-control',
      name: 'SelectControlComponent',
      selector: '<lib-select-control>',
      category: 'Selections & Badges',
      description: 'Single-select relational dropdown that queries an entity dataset via DataService.findAll() and binds the selected record foreign key (e.g. species_id) with searchable display text.',
      attribute: {
        name: 'species',
        label: 'Species',
        description: 'Taxonomic classification of the patient',
        type: AttributeType.ManyToOne,
        visibility: VisibilityType.Required,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        relationshipTarget: 'Species',
        typeaheadSearch: ['scientific_name', 'common_name'],
        discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
        rules: [],
        enumeration: [],
        unitOfMeasure: '',
        scale: '',
      },
      cell: {
        width: '6',
        height: '1',
        attributeName: 'species',
        component: 'Select',
      },
      initialValue: '85d08cf5-aa6d-4b36-8701-44121892aa48',
      samplePresets: [
        { label: 'Mammalia (Mammals)', value: '85d08cf5-aa6d-4b36-8701-44121892aa48' },
        { label: 'Aves (Birds)', value: '66bc9d74-0092-4b3e-a5ae-7b7f52b0837b' },
        { label: 'Animalia (Animals)', value: '56f05f10-5334-4904-adef-72ac2031a995' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'ManyToOne relational foreign key identifier' },
        { property: 'Dynamic Data Loading', description: 'Fetches option list via DataService.findAll(relationshipTarget).' },
        { property: 'Search & Formatting', description: 'Formats options using typeaheadSearch fields or default name.' },
        { property: 'View Mode', description: 'Resolves entity via cache/findById and displays formatted label in a read-only input.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'species', component: 'Select' },
      featurePath: '/assets/features/components/select-control.feature',
      fallbackFeature: `Feature: Select Control Component
  As a veterinary staff member
  I want a relational dropdown selector that dynamically loads entity records
  So that I can select a related entity accurately

  @showcase @select-control
  Scenario: Select related entity and switch between edit and view modes
    When I navigate to "/showcase/select-control"
    Then the showcase header should display "SelectControlComponent"
    And the select control dropdown should be visible
    When I click the showcase button "btn-mode-view"
    Then the select control view should display formatted text
    When I click the showcase button "btn-mode-edit"
    Then the select control dropdown should be visible`
    },
    {
      id: 'select-multiple',
      name: 'SelectMultipleControlComponent',
      selector: '<lib-select-multiple-control>',
      category: 'Selections & Badges',
      description: 'Multi-selection dropdown widget with interactive tag badges. Users can select multiple items from a relational entity dataset, remove tags with one click, and serialize values as comma-delimited strings.',
      attribute: {
        name: 'clinic_affiliations',
        label: 'Clinic Affiliations',
        description: 'Associated clinic branches',
        type: AttributeType.SelectMultiple,
        visibility: VisibilityType.Visible,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        relationshipTarget: 'Clinic',
        typeaheadSearch: ['name'],
        discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
        rules: [],
        enumeration: [],
        unitOfMeasure: '',
        scale: '',
      },
      cell: {
        width: '8',
        height: '1',
        attributeName: 'clinic_affiliations',
        component: 'SelectMultiple',
      },
      initialValue: 'Central Hutt Vets,Animal Health Centre',
      samplePresets: [
        { label: 'Central Hutt & Animal Health', value: 'Central Hutt Vets,Animal Health Centre' },
        { label: 'PETVET Lower Hutt', value: 'PETVET Lower Hutt' },
        { label: 'Animates Vetcare Clinic', value: 'Animates Vetcare Clinic' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'SelectMultiple (persisted as comma-separated entity name string)' },
        { property: 'Interactive Tags', description: 'Selected options appear as blue pill badges with close (X) remove buttons.' },
        { property: 'Dropdown Menu', description: 'ngbDropdown popup containing available choices from DataService.findAll().' },
        { property: 'View Mode', description: 'Renders selected tags as read-only badges or em-dash if empty.' }
      ],
      metaPageJson: { width: '8', height: '1', attributeName: 'clinic_affiliations', component: 'SelectMultiple' },
      featurePath: '/assets/features/components/select-multiple.feature',
      fallbackFeature: `Feature: Select Multiple Control Component
  As a veterinary nurse or receptionist
  I want a multi-select control that displays choices as removable badges
  So that multiple affiliations or options can be selected and managed cleanly

  @showcase @select-multiple
  Scenario: Manage multiple selected options with interactive tag badges
    When I navigate to "/showcase/select-multiple"
    Then the showcase header should display "SelectMultipleControlComponent"
    And the select multiple control should display selected tag "Central Hutt Vets"
    And the select multiple control should display selected tag "Animal Health Centre"
    When I click the showcase button "btn-mode-view"
    Then the select multiple view should display badge "Central Hutt Vets"
    And the select multiple view should display badge "Animal Health Centre"
    When I click the showcase button "btn-mode-edit"
    Then the select multiple control should display selected tag "Central Hutt Vets"`
    },
    {
      id: 'select-two',
      name: 'SelectTwoControlComponent',
      selector: '<lib-select-two-control>',
      category: 'Selections & Badges',
      description: 'Compound two-level selector combining a primary ManyToOne entity dropdown and a secondary dependent enumeration dropdown. Selecting a clinic dynamically populates its staff members in the secondary list.',
      attribute: {
        name: 'clinic',
        label: 'Clinic & Staff Member',
        description: 'Primary clinic with dependent staff member selection',
        type: AttributeType.ManyToOne,
        visibility: VisibilityType.Visible,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        relationshipTarget: 'Clinic',
        typeaheadSearch: ['name'],
        discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
        rules: [],
        enumeration: [],
        unitOfMeasure: '',
        scale: '',
      },
      cell: {
        width: '12',
        height: '1',
        attributeName: 'clinic',
        component: 'SelectTwo',
        componentData: {
          secondaryAttributeName: 'staff_member',
          optionsMap: {
            'PETVET Lower Hutt': [
              'Dr. Sarah Smith (Lead Vet)',
              'Nurse Tom Evans',
              'Dr. Jack Wilson'
            ],
            'cf756f73-7a1a-4b86-9cd5-367649f19874': [
              'Dr. Sarah Smith (Lead Vet)',
              'Nurse Tom Evans',
              'Dr. Jack Wilson'
            ],
            'Central Hutt Vets': [
              'Dr. Emily Brown (Senior Surgeon)',
              'Nurse Chloe Davis',
              'Dr. Alan Walker'
            ],
            '7efa6559-4cc2-4ecb-85f6-3c6d3be069dc': [
              'Dr. Emily Brown (Senior Surgeon)',
              'Nurse Chloe Davis',
              'Dr. Alan Walker'
            ],
            'Animal Health Centre': [
              'Dr. Bruce Banner (Specialist)',
              'Nurse Natasha Romanoff'
            ],
            '0efa743d-1115-46ad-8055-9b7968d08a52': [
              'Dr. Bruce Banner (Specialist)',
              'Nurse Natasha Romanoff'
            ],
            'Animates Vetcare Clinic': [
              'Dr. Peter Parker (Avian & Exotic)',
              'Nurse Mary Jane'
            ],
            '9347b91d-29f6-4bf4-b204-4894a9935cce': [
              'Dr. Peter Parker (Avian & Exotic)',
              'Nurse Mary Jane'
            ]
          }
        }
      },
      initialValue: 'cf756f73-7a1a-4b86-9cd5-367649f19874',
      initialSecondaryValue: 'Dr. Sarah Smith (Lead Vet)',
      samplePresets: [
        { label: 'PETVET Lower Hutt', value: 'cf756f73-7a1a-4b86-9cd5-367649f19874' },
        { label: 'Central Hutt Vets', value: '7efa6559-4cc2-4ecb-85f6-3c6d3be069dc' },
        { label: 'Animal Health Centre', value: '0efa743d-1115-46ad-8055-9b7968d08a52' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'ManyToOne compound binding with secondary dependent attribute' },
        { property: 'Two-Column Layout', description: 'Renders primary <lib-select-control> and secondary <lib-enumeration-control> side by side.' },
        { property: 'Dependent Cascading', description: 'When primary entity changes, secondary dropdown options update from entity attribute or componentData.optionsMap.' },
        { property: 'Staff Selection Scenario', description: 'Selecting a clinic dynamically populates staff members for that clinic without altering the Clinic database schema.' },
        { property: 'View Mode', description: 'Renders read-only controls or combined text depending on labelLayout.' }
      ],
      metaPageJson: {
        width: '12',
        height: '1',
        attributeName: 'clinic',
        component: 'SelectTwo',
        componentData: {
          secondaryAttributeName: 'staff_member',
          optionsMap: {
            'PETVET Lower Hutt': ['Dr. Sarah Smith (Lead Vet)', 'Nurse Tom Evans', 'Dr. Jack Wilson'],
            'Central Hutt Vets': ['Dr. Emily Brown (Senior Surgeon)', 'Nurse Chloe Davis', 'Dr. Alan Walker'],
            'Animal Health Centre': ['Dr. Bruce Banner (Specialist)', 'Nurse Natasha Romanoff'],
            'Animates Vetcare Clinic': ['Dr. Peter Parker (Avian & Exotic)', 'Nurse Mary Jane']
          }
        }
      },
      featurePath: '/assets/features/components/select-two.feature',
      fallbackFeature: `Feature: Select Two Control Component
  As a veterinary user recording multi-level categorizations
  I want a compound selector with primary and secondary controls
  So that hierarchical choices can be made together in a clean row

  @showcase @select-two
  Scenario: Display compound primary and secondary dropdowns in edit and view modes
    When I navigate to "/showcase/select-two"
    Then the showcase header should display "SelectTwoControlComponent"
    And the select two primary dropdown should be visible
    And the select two secondary dropdown should contain option "Dr. Sarah Smith (Lead Vet)"
    When I click the showcase button "btn-mode-view"
    Then the select two view should display formatted text
    When I click the showcase button "btn-mode-edit"
    Then the select two primary dropdown should be visible

  @showcase @select-two
  Scenario: Changing primary clinic updates the secondary staff member options
    When I navigate to "/showcase/select-two"
    Then the select two secondary dropdown should contain option "Dr. Sarah Smith (Lead Vet)"
    When I select clinic "Central Hutt Vets" in the select two primary dropdown
    Then the select two secondary dropdown should contain option "Dr. Emily Brown (Senior Surgeon)"
    And the select two secondary dropdown should not contain option "Dr. Sarah Smith (Lead Vet)"
    When I select clinic "Animal Health Centre" in the select two primary dropdown
    Then the select two secondary dropdown should contain option "Dr. Bruce Banner (Specialist)"
    And the select two secondary dropdown should not contain option "Dr. Emily Brown (Senior Surgeon)"`
    },

    // -------------------------------------------------------------------------
    // CATEGORY: Action & Navigation Tools
    // -------------------------------------------------------------------------
    {
      id: 'button-tool',
      name: 'ButtonToolComponent',
      selector: '<lib-button-tool>',
      category: 'Action & Navigation Tools',
      description: 'Action trigger button rendered in layout cells or toolbars. Supports customizable styles, Material icons, channel event dispatching, and route navigation.',
      attribute: {
        name: 'button_action',
        label: 'Action Trigger',
        description: 'Action trigger tool attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Optional,
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
        attributeName: 'button_action',
        tool: {
          type: ToolType.Button,
          channel: 'default',
          containerStyles: '',
          styles: 'btn btn-primary',
          label: 'Save Patient Record',
          modes: '',
          action: 'save',
          route: '',
          icon: 'save',
          actionPermit: ActionType.Edit,
          subjectPermit: 'Pet'
        } as any
      },
      initialValue: 'save',
      samplePresets: [
        { label: 'Save Record', value: 'save' },
        { label: 'Submit Consultation', value: 'submit' },
        { label: 'Cancel', value: 'cancel' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.Button' },
        { property: 'Event Dispatching', description: 'Dispatches onAction events to EventService via channel.' },
        { property: 'Route Navigation', description: 'Supports route expressions evaluated against ctx.dataMap.' },
        { property: 'Styling & Icons', description: 'Custom CSS classes and Material Symbols icon integration.' }
      ],
      metaPageJson: {
        width: '4',
        height: '1',
        tool: {
          type: 'Button',
          channel: 'default',
          styles: 'btn btn-primary',
          label: 'Save Patient Record',
          action: 'save',
          icon: 'save'
        }
      },
      featurePath: '/assets/features/components/button-tool.feature',
      fallbackFeature: `Feature: Button Tool Component
  As an application user or clinician
  I want interactive action buttons in page layouts and toolbars
  So that I can trigger actions, save records, and navigate routes

  @showcase @button-tool
  Scenario: Display and inspect button tool in edit and view modes
    When I navigate to "/showcase/button-tool"
    Then the showcase header should display "ButtonToolComponent"
    And the button tool should be visible with label "Save Patient Record"
    When I click the showcase button "btn-mode-view"
    Then the button tool should be visible with label "Save Patient Record"
    When I click the showcase button "btn-mode-edit"
    Then the button tool should be visible with label "Save Patient Record"`
    },
    {
      id: 'button-group-tool',
      name: 'ButtonGroupToolComponent',
      selector: '<lib-button-group-tool>',
      category: 'Action & Navigation Tools',
      description: 'Multi-button segmented radio toggle group. Splits comma-delimited labels and actions into an interactive button strip with active state tracking.',
      attribute: {
        name: 'button_group_selection',
        label: 'Segmented Action Group',
        description: 'Segmented radio button group attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Optional,
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
        attributeName: 'button_group_selection',
        tool: {
          type: ToolType.ButtonGroup,
          channel: 'timeframe',
          containerStyles: '',
          styles: 'btn btn-outline-secondary',
          label: 'Day,Week,Month,Year',
          modes: '',
          action: 'day,week,month,year',
          route: ''
        } as any
      },
      initialValue: 'Day',
      samplePresets: [
        { label: 'Day / Week / Month', value: 'Day,Week,Month' },
        { label: 'Morning / Afternoon / Evening', value: 'Morning,Afternoon,Evening' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.ButtonGroup' },
        { property: 'Delimited Parsing', description: 'Splits comma-separated label and action strings into buttons.' },
        { property: 'Radio Group', description: 'Renders Bootstrap .btn-group with active selection styling.' },
        { property: 'Event Emission', description: 'Emits action event and dispatches to EventService on selection.' }
      ],
      metaPageJson: {
        width: '6',
        height: '1',
        tool: {
          type: 'ButtonGroup',
          channel: 'timeframe',
          styles: 'btn btn-outline-secondary',
          label: 'Day,Week,Month,Year',
          action: 'day,week,month,year'
        }
      },
      featurePath: '/assets/features/components/button-group-tool.feature',
      fallbackFeature: `Feature: Button Group Tool Component
  As a clinician reviewing timeline data
  I want segmented radio buttons to switch between timeframes or action modes
  So that I can quickly filter and toggle views

  @showcase @button-group-tool
  Scenario: Display and toggle options in button group tool
    When I navigate to "/showcase/button-group-tool"
    Then the showcase header should display "ButtonGroupToolComponent"
    And the button group tool should display button "Day"
    And the button group tool should display button "Week"
    And the button group tool should display button "Month"
    When I click button group button "Week"
    Then button group button "Week" should be active`
    },
    {
      id: 'button-tabs-tool',
      name: 'ButtonTabsToolComponent',
      selector: '<lib-button-tabs-tool>',
      category: 'Action & Navigation Tools',
      description: 'Template and sub-page switcher driving layout outlets through segmented tab buttons. Integrates with MetaPageService to switch active templates dynamically.',
      attribute: {
        name: 'active_tab_template',
        label: 'Template Tab Switcher',
        description: 'Template tab selector attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Optional,
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
        height: '2',
        attributeName: 'active_tab_template',
        tool: {
          type: ToolType.ButtonTabs,
          channel: 'tabs',
          containerStyles: '',
          styles: 'btn btn-outline-primary',
          label: 'Clinical Media Views',
          modes: '',
          templateIndex: 0,
          template1: 'PetMediaSingle.tab',
          template2: 'PetMediaMultiple.tab'
        } as any
      },
      initialValue: 'PetMediaSingle.tab',
      samplePresets: [
        { label: 'Single Media View', value: 'PetMediaSingle.tab' },
        { label: 'Multiple Media Gallery', value: 'PetMediaMultiple.tab' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.ButtonTabs' },
        { property: 'Template Routing', description: 'Resolves page templates via MetaPageService.metaPageMap$.' },
        { property: 'Embedded Outlet', description: 'Switches template rendered in <lib-layout-outlet>.' },
        { property: 'Data Inspection', description: 'Auto-selects active tab based on presence of event data.' }
      ],
      metaPageJson: {
        width: '12',
        height: '2',
        tool: {
          type: 'ButtonTabs',
          channel: 'tabs',
          label: 'Clinical Media Views',
          template1: 'PetMediaSingle.tab',
          template2: 'PetMediaMultiple.tab'
        }
      },
      featurePath: '/assets/features/components/button-tabs-tool.feature',
      fallbackFeature: `Feature: Button Tabs Tool Component
  As a clinician reviewing multi-view patient records
  I want segmented button tabs to switch between sub-templates
  So that layout outlets dynamically load and display template views

  @showcase @button-tabs-tool
  Scenario: Display button tabs tool
    When I navigate to "/showcase/button-tabs-tool"
    Then the showcase header should display "ButtonTabsToolComponent"
    And the button tabs tool should be visible`
    },
    {
      id: 'link-tool',
      name: 'LinkToolComponent',
      selector: '<lib-link-tool>',
      category: 'Action & Navigation Tools',
      description: 'Inline text and hyperlink parser. Replaces <a> tags with clickable navigation or action anchors embedded smoothly within sentence text.',
      attribute: {
        name: 'link_navigation',
        label: 'Inline Hyperlink Tool',
        description: 'Inline link parser attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Optional,
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
        width: '8',
        height: '1',
        attributeName: 'link_navigation',
        tool: {
          type: ToolType.Link,
          channel: 'navigation',
          containerStyles: '',
          styles: '',
          label: 'Patient Schedule',
          modes: '',
          text: 'Click <a>here to view clinic schedule</a> or return to search.',
          action: 'view_schedule',
          route: '/data/Pet/search'
        } as any
      },
      initialValue: 'view_schedule',
      samplePresets: [
        { label: 'Schedule Link', value: 'Click <a>here to view clinic schedule</a> or return to search.' },
        { label: 'Documentation Link', value: 'Need assistance? Read the <a>online documentation</a>.' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.Link' },
        { property: 'Tag Parsing', description: 'Parses <a>...</a> tags into mixed text and clickable LinkFragment objects.' },
        { property: 'Action or Route', description: 'Dispatches custom framework actions or routes via Router.' },
        { property: 'Inline Flow', description: 'Blends seamlessly into surrounding paragraphs and layout labels.' }
      ],
      metaPageJson: {
        width: '8',
        height: '1',
        tool: {
          type: 'Link',
          channel: 'navigation',
          text: 'Click <a>here to view clinic schedule</a> or return to search.',
          action: 'view_schedule'
        }
      },
      featurePath: '/assets/features/components/link-tool.feature',
      fallbackFeature: `Feature: Link Tool Component
  As a user reading form instructions and navigation prompts
  I want inline links embedded naturally inside text
  So that I can trigger actions or navigate to related pages directly

  @showcase @link-tool
  Scenario: Display inline link tool with clickable anchor
    When I navigate to "/showcase/link-tool"
    Then the showcase header should display "LinkToolComponent"
    And the link tool should display link text "here to view clinic schedule"`
    },

    // -------------------------------------------------------------------------
    // CATEGORY: Presentation Tools
    // -------------------------------------------------------------------------
    {
      id: 'page-title-tool',
      name: 'PageTitleToolComponent',
      selector: '<lib-page-title-tool>',
      category: 'Presentation Tools',
      description: 'Contextual page title header rendering dynamic titles based on page mode (search, add, view, update) or static titles from metaPage.title.',
      attribute: {
        name: 'page_title',
        label: 'Page Heading',
        description: 'Page title tool attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Optional,
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
        height: '1',
        attributeName: 'page_title',
        tool: {
          type: ToolType.PageTitle,
          channel: '',
          containerStyles: '',
          styles: '',
          label: 'Page Title',
          modes: '',
          nameAttributes: ''
        } as any
      },
      initialValue: 'Patient Clinical Record',
      samplePresets: [
        { label: 'Static Title', value: '' },
        { label: 'Dynamic Name (Pet)', value: 'name' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.PageTitle' },
        { property: 'Mode Adaptation', description: 'Automatically prefixes titles: "Search [Entity]", "Add [Entity]", "Update [Entity]".' },
        { property: 'Static Fallback', description: 'Renders ctx.metaPage.title when nameAttributes is not configured.' },
        { property: 'Editor Support', description: 'Provides click-to-edit integration for PropertySheetService in editor mode.' }
      ],
      metaPageJson: {
        width: '12',
        height: '1',
        tool: {
          type: 'PageTitle',
          nameAttributes: ''
        }
      },
      featurePath: '/assets/features/components/page-title-tool.feature',
      fallbackFeature: `Feature: Page Title Tool Component
  As a user navigating application pages
  I want contextual page titles that clearly reflect the active page and mode
  So that I understand what entity and action I am working on

  @showcase @page-title-tool
  Scenario: Display contextual page title in edit and view modes
    When I navigate to "/showcase/page-title-tool"
    Then the showcase header should display "PageTitleToolComponent"
    And the page title heading should display "Showcase Preview"`
    },
    {
      id: 'text-tool',
      name: 'TextToolComponent',
      selector: '<lib-text-tool>',
      category: 'Presentation Tools',
      description: 'Evaluated presentation text banner that renders static text or dynamic expressions computed against formGroup and dataMap.',
      attribute: {
        name: 'presentation_text',
        label: 'Banner Text',
        description: 'Presentation banner text attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Optional,
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
        height: '1',
        attributeName: 'presentation_text',
        tool: {
          type: ToolType.TextTool,
          channel: '',
          containerStyles: '',
          styles: 'alert alert-info py-2 px-3 fw-bold mb-0',
          label: 'Status Banner',
          modes: '',
          text: 'Patient Status: Registered and Active in System'
        } as any
      },
      initialValue: 'Patient Status: Registered and Active in System',
      samplePresets: [
        { label: 'Active Banner', value: 'Patient Status: Registered and Active in System' },
        { label: 'Alert Banner', value: 'Alert: Scheduled for follow-up vaccination' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.TextTool' },
        { property: 'Expression Evaluation', description: 'Evaluates text template expressions against formGroup or dataMap.' },
        { property: 'Dynamic Styling', description: 'Applies CSS classes dynamically via expressionService.' },
        { property: 'Presentation Slot', description: 'Ideal for headings, contextual alerts, instructions, and dividers.' }
      ],
      metaPageJson: {
        width: '12',
        height: '1',
        tool: {
          type: 'TextTool',
          styles: 'alert alert-info py-2 px-3 fw-bold mb-0',
          text: 'Patient Status: Registered and Active in System'
        }
      },
      featurePath: '/assets/features/components/text-tool.feature',
      fallbackFeature: `Feature: Text Tool Component
  As a form designer or clinician
  I want contextual text banners and messages rendered inside form layouts
  So that important instructions, statuses, and alerts are highlighted

  @showcase @text-tool
  Scenario: Display presentation text banner
    When I navigate to "/showcase/text-tool"
    Then the showcase header should display "TextToolComponent"
    And the text tool banner should display "Patient Status: Registered and Active in System"`
    },
    {
      id: 'icon-tool',
      name: 'IconToolComponent',
      selector: '<lib-icon-tool>',
      category: 'Presentation Tools',
      description: 'Visual glyph tool displaying Google Material Symbols icons with evaluated styling and expression-driven icon names.',
      attribute: {
        name: 'status_icon',
        label: 'Visual Icon',
        description: 'Icon tool attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Optional,
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
        attributeName: 'status_icon',
        tool: {
          type: ToolType.Icon,
          channel: '',
          containerStyles: '',
          styles: 'text-primary fs-2',
          label: 'Clinic Icon',
          modes: '',
          iconName: 'pets'
        } as any
      },
      initialValue: 'pets',
      samplePresets: [
        { label: 'Pets (Paw)', value: 'pets' },
        { label: 'Medical (Cross)', value: 'medical_services' },
        { label: 'Hospital', value: 'local_hospital' },
        { label: 'Vaccine', value: 'vaccines' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.Icon' },
        { property: 'Icon Font', description: 'Uses Google Material Symbols Outlined font.' },
        { property: 'Dynamic Evaluation', description: 'Evaluates icon name and styles against form values.' },
        { property: 'Editor Integration', description: 'Supports ToolPaletteComponent defaults and PropertySheet editing.' }
      ],
      metaPageJson: {
        width: '4',
        height: '1',
        tool: {
          type: 'Icon',
          styles: 'text-primary fs-2',
          iconName: 'pets'
        }
      },
      featurePath: '/assets/features/components/icon-tool.feature',
      fallbackFeature: `Feature: Icon Tool Component
  As a user reviewing clinical dashboards and records
  I want prominent visual icons to identify categories and statuses at a glance
  So that visual cues reinforce important information

  @showcase @icon-tool
  Scenario: Display icon tool with Material Symbols
    When I navigate to "/showcase/icon-tool"
    Then the showcase header should display "IconToolComponent"
    And the icon tool should display icon "pets"`
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
