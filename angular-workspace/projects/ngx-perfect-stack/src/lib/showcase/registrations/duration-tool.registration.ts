import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';
import { ToolType } from '../../domain/meta.page';

// -------------------------------------------------------------------------
// CATEGORY: Diagnostic Tools
// -------------------------------------------------------------------------
export const durationToolRegistration: ShowcaseItem = {
  id: 'duration-tool',
  name: 'DurationToolComponent',
  selector: '<lib-duration-tool>',
  category: 'Diagnostic Tools',
  description: 'Calculates and formats elapsed duration between start and end timestamps. Live updates whenever either timestamp control changes.',
  attribute: {
    name: 'duration',
    label: 'Calculated Duration',
    description: 'Formatted duration interval',
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
    tool: {
      type: ToolType.Duration
    } as any
  },
  initialValue: '2026-11-01T17:30:00Z',
  samplePresets: [
    { label: '8h 30m (8.5 Hours)', value: '2026-11-01T17:30:00Z' },
    { label: '2d 4h (2 Days 4 Hours)', value: '2026-11-03T13:00:00Z' },
    { label: '45m (45 Minutes)', value: '2026-11-01T09:45:00Z' }
  ],
  docProperties: [
    { property: 'Tool Type', description: 'ToolType.Duration' },
    { property: 'Bound Controls', description: 'Subscribes to "date_time" and "end_date_time" controls.' },
    { property: 'Format Output', description: 'Outputs dynamic interval notation, e.g. "2d 4h 30m".' },
    { property: 'Reactive Updates', description: 'Instantly recalculates when either start or end timestamp changes.' }
  ],
  metaPageJson: {
    width: '6',
    height: '1',
    tool: {
      type: ToolType.Duration
    }
  },
  featurePath: '/assets/features/components/duration-tool.feature',
  fallbackFeature: `Feature: Duration Tool Component
  As a clinician tracking patient procedures
  I want a calculated duration display
  So that I can see the elapsed time between start and end timestamps

  @showcase @duration-tool
  Scenario: Display calculated duration between timestamps
    When I navigate to "/showcase/duration-tool"
    Then the showcase header should display "DurationToolComponent"
    And the duration tool should be visible
    When I click the showcase button "btn-mode-view"
    Then the duration tool should be visible
    When I click the showcase button "btn-mode-edit"
    Then the duration tool should be visible`
};
