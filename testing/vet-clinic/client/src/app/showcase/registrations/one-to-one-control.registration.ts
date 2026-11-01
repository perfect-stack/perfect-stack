import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Relational Controls
// -------------------------------------------------------------------------
export const oneToOneControlRegistration: ShowcaseItem = {
  id: 'one-to-one-control',
  name: 'OneToOneControlComponent',
  selector: '<lib-one-to-one-control>',
  category: 'Relational Controls',
  description: 'Nested sub-form layout for tightly coupled 1:1 entity relationships. Subscribes to child FormGroup and renders child entity attributes inside a child layout outlet.',
  attribute: {
    name: 'owner',
    label: 'Primary Owner',
    description: 'OneToOne relationship with Owner entity',
    type: AttributeType.OneToOne,
    visibility: VisibilityType.Visible,
    comparisonField: '',
    comparisonOperator: ComparisonOperator.Equals,
    relationshipTarget: 'Owner',
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
    attributeName: 'owner',
    component: 'OneToOne',
    template: {
      binding: 'owner',
      templateHeading: 'Owner Details',
      type: 'form',
      metaEntityName: 'Owner',
      cells: [
        [
          { width: '6', height: '1', attributeName: 'given_name' },
          { width: '6', height: '1', attributeName: 'family_name' }
        ],
        [
          { width: '6', height: '1', attributeName: 'phone_number' },
          { width: '6', height: '1', attributeName: 'email_address' }
        ]
      ]
    } as any
  },
  initialValue: {
    given_name: 'Sarah',
    family_name: 'Connor',
    phone_number: '021 555 4321',
    email_address: 'sarah.connor@example.com'
  },
  samplePresets: [
    {
      label: 'Sarah Connor',
      value: {
        given_name: 'Sarah',
        family_name: 'Connor',
        phone_number: '021 555 4321',
        email_address: 'sarah.connor@example.com'
      }
    },
    {
      label: 'John Wick',
      value: {
        given_name: 'John',
        family_name: 'Wick',
        phone_number: '022 999 8888',
        email_address: 'john.wick@continental.com'
      }
    }
  ],
  docProperties: [
    { property: 'Supported Type', description: 'AttributeType.OneToOne' },
    { property: 'Nested Form Group', description: 'Binds child attributes to a child FormGroup within the parent form hierarchy.' },
    { property: 'Child Layout', description: 'Renders embedded FormLayoutComponent through LayoutOutletComponent.' },
    { property: 'Metadata Resolution', description: 'Resolves child attribute metadata via MetaEntityService.metaEntityMap$.' }
  ],
  metaPageJson: {
    width: '12',
    height: '2',
    attributeName: 'owner',
    component: 'OneToOne',
    template: {
      binding: 'owner',
      type: 'form',
      metaEntityName: 'Owner',
      cells: [
        [
          { width: '6', height: '1', attributeName: 'given_name' },
          { width: '6', height: '1', attributeName: 'family_name' }
        ],
        [
          { width: '6', height: '1', attributeName: 'phone_number' },
          { width: '6', height: '1', attributeName: 'email_address' }
        ]
      ]
    }
  },
  featurePath: '/assets/features/components/one-to-one-control.feature',
  fallbackFeature: `Feature: One To One Control Component
  As a user managing complex records
  I want a nested 1:1 sub-form to inspect and edit tightly coupled child entities
  So that child entity attributes are modified directly inside the parent page

  @showcase @one-to-one-control
  Scenario: Display nested one-to-one sub-form
    When I navigate to "/showcase/one-to-one-control"
    Then the showcase header should display "OneToOneControlComponent"
    And the one to one control should be visible
    When I click the showcase button "btn-mode-view"
    Then the one to one control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the one to one control should be visible`
};
