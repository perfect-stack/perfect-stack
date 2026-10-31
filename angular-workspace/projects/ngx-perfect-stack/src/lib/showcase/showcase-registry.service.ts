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
