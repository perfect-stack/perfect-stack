import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

export const dateTimeRegistration: ShowcaseItem = {
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
    };
