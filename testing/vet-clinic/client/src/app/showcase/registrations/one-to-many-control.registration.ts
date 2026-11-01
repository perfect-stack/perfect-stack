import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Relational Controls
// -------------------------------------------------------------------------
export const oneToManyControlRegistration: ShowcaseItem = {
  id: 'one-to-many-control',
  name: 'OneToManyControlComponent',
  selector: '<lib-one-to-many-control>',
  category: 'Relational Controls',
  description: 'Embedded sub-table grid for OneToMany child entity collections. Renders child records with tabular columns, add/remove row actions, and nested field editing.',
  attribute: {
    name: 'vaccinations',
    label: 'Patient Vaccinations',
    description: 'OneToMany vaccination records',
    type: AttributeType.OneToMany,
    visibility: VisibilityType.Visible,
    comparisonField: '',
    comparisonOperator: ComparisonOperator.Equals,
    relationshipTarget: 'Vaccination',
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
    attributeName: 'vaccinations',
    component: 'OneToMany',
    template: {
      binding: 'vaccinations',
      templateHeading: 'Vaccinations',
      type: 'table',
      metaEntityName: 'Vaccination',
      cells: [
        [
          { width: '4', height: '1', attributeName: 'vaccine_name' },
          { width: '4', height: '1', attributeName: 'date_administered' },
          { width: '4', height: '1', attributeName: 'batch_number' }
        ]
      ]
    } as any
  },
  initialValue: [
    { id: '1', vaccine_name: 'Rabies Booster', date_administered: '2026-01-15', batch_number: 'RB-2026-09' },
    { id: '2', vaccine_name: 'DHPP Core', date_administered: '2025-06-20', batch_number: 'DH-8841-A' }
  ],
  samplePresets: [
    {
      label: '2 Vaccinations',
      value: [
        { id: '1', vaccine_name: 'Rabies Booster', date_administered: '2026-01-15', batch_number: 'RB-2026-09' },
        { id: '2', vaccine_name: 'DHPP Core', date_administered: '2025-06-20', batch_number: 'DH-8841-A' }
      ]
    },
    {
      label: '1 Vaccination',
      value: [
        { id: '1', vaccine_name: 'Rabies Booster', date_administered: '2026-01-15', batch_number: 'RB-2026-09' }
      ]
    },
    {
      label: 'Empty List',
      value: []
    }
  ],
  docProperties: [
    { property: 'Supported Type', description: 'AttributeType.OneToMany' },
    { property: 'Layout Integration', description: 'Renders embedded TableLayoutComponent via LayoutOutletComponent.' },
    { property: 'Entity Target', description: 'Binds child entities defined by cell.template.metaEntityName.' },
    { property: 'Collection Management', description: 'Synchronizes with FormArray supporting row insertions and deletions.' }
  ],
  metaPageJson: {
    width: '12',
    height: '2',
    attributeName: 'vaccinations',
    component: 'OneToMany',
    template: {
      binding: 'vaccinations',
      type: 'table',
      metaEntityName: 'Vaccination',
      cells: [
        [
          { width: '4', height: '1', attributeName: 'vaccine_name' },
          { width: '4', height: '1', attributeName: 'date_administered' },
          { width: '4', height: '1', attributeName: 'batch_number' }
        ]
      ]
    }
  },
  featurePath: '/assets/features/components/one-to-many-control.feature',
  fallbackFeature: `Feature: One To Many Control Component
  As a clinician reviewing patient records
  I want an embedded sub-table grid for one-to-many child collections
  So that child entity records can be inspected and updated in context

  @showcase @one-to-many-control
  Scenario: Display embedded one-to-many sub-table
    When I navigate to "/showcase/one-to-many-control"
    Then the showcase header should display "OneToManyControlComponent"
    And the one to many control should be visible
    When I click the showcase button "btn-mode-view"
    Then the one to many control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the one to many control should be visible`
};
