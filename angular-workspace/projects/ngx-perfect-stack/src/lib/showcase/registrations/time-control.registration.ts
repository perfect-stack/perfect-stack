import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

export const timeControlRegistration: ShowcaseItem = {
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
    };
