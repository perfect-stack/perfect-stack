import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Observations
// -------------------------------------------------------------------------
export const assertionListControlRegistration: ShowcaseItem = {
  id: 'assertion-list-control',
  name: 'AssertionListControlComponent',
  selector: '<lib-assertion-list-control>',
  category: 'Observations',
  description: 'Clinical observation and assertion collection grid. Supports card and field layouts for recording medical assertions, measurements, units, and clinical facts.',
  attribute: {
    name: 'assertions',
    label: 'Patient Assertions',
    description: 'Clinical observation facts and measurements',
    type: AttributeType.OneToMany,
    visibility: VisibilityType.Visible,
    comparisonField: '',
    comparisonOperator: ComparisonOperator.Equals,
    relationshipTarget: 'Assertion',
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
    attributeName: 'assertions',
    component: 'AssertionList',
    options: 'Card'
  },
  initialValue: [
    {
      id: '1',
      assertion_type_name: 'Temperature estimate',
      assertion_unit: '°C',
      assertion_value_numeric: 38.5,
      assertion_notes: 'Normal body temperature'
    },
    {
      id: '2',
      assertion_type_name: 'Radial distance',
      assertion_unit: 'm',
      assertion_value_numeric: 12.0,
      assertion_notes: 'Visual observation'
    }
  ],
  samplePresets: [
    {
      label: '2 Observations',
      value: [
        {
          id: '1',
          assertion_type_name: 'Temperature estimate',
          assertion_unit: '°C',
          assertion_value_numeric: 38.5,
          assertion_notes: 'Normal body temperature'
        },
        {
          id: '2',
          assertion_type_name: 'Radial distance',
          assertion_unit: 'm',
          assertion_value_numeric: 12.0,
          assertion_notes: 'Visual observation'
        }
      ]
    },
    {
      label: '1 Observation',
      value: [
        {
          id: '1',
          assertion_type_name: 'Temperature estimate',
          assertion_unit: '°C',
          assertion_value_numeric: 39.2,
          assertion_notes: 'Slight fever'
        }
      ]
    },
    {
      label: 'Empty Assertions',
      value: []
    }
  ],
  docProperties: [
    { property: 'Supported Type', description: 'AttributeType.OneToMany with cell.component = "AssertionList"' },
    { property: 'Layout Styles', description: 'Supports "Card", "Field", and "Table" observation layouts.' },
    { property: 'Assertion Types', description: 'Binds dynamically to AssertionType definitions.' },
    { property: 'Mode Switching', description: 'Adapts interactive inputs in edit mode and clean clinical cards in view mode.' }
  ],
  metaPageJson: {
    width: '12',
    height: '2',
    attributeName: 'assertions',
    component: 'AssertionList',
    options: 'Card'
  },
  featurePath: '/assets/features/components/assertion-list-control.feature',
  fallbackFeature: `Feature: Assertion List Control Component
  As a clinician recording patient observations
  I want a flexible assertion list to capture clinical measurements and facts
  So that patient health data is documented accurately in card or field layouts

  @showcase @assertion-list-control
  Scenario: Display clinical assertion list in edit and view modes
    When I navigate to "/showcase/assertion-list-control"
    Then the showcase header should display "AssertionListControlComponent"
    And the assertion list control should be visible
    When I click the showcase button "btn-mode-view"
    Then the assertion list control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the assertion list control should be visible`
};
