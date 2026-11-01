import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

export const flexibleDateTimeRegistration: ShowcaseItem = {
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
    };
