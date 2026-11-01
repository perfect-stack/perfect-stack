import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Relational Controls
// -------------------------------------------------------------------------
export const manyToOneControlRegistration: ShowcaseItem = {
  id: 'many-to-one-control',
  name: 'ManyToOneControlComponent',
  selector: '<lib-many-to-one-control>',
  category: 'Relational Controls',
  description: 'Asynchronous typeahead search lookup for foreign key ManyToOne relationships. Queries backend typeahead API and binds selected model ID and display text.',
  attribute: {
    name: 'species',
    label: 'Patient Species',
    description: 'Species foreign key reference',
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
    component: 'ManyToOne',
    metaEntity: {
      name: 'Pet',
      pluralName: 'Pets',
      attributes: []
    } as any
  },
  initialValue: '791091c8-4374-4530-aa43-64b063ef5c2e',
  samplePresets: [
    { label: 'Felis catus', value: '791091c8-4374-4530-aa43-64b063ef5c2e' },
    { label: 'Animalia', value: '56f05f10-5334-4904-adef-72ac2031a995' },
    { label: 'Clear', value: null }
  ],
  docProperties: [
    { property: 'Supported Type', description: 'AttributeType.ManyToOne' },
    { property: 'Typeahead Search', description: 'Debounced search against backend /typeahead endpoint.' },
    { property: 'Edit Mode', description: 'Renders NgbTypeahead input with formatted dropdown results.' },
    { property: 'View Mode', description: 'Renders hyperlink to target entity record or dash if null.' }
  ],
  metaPageJson: {
    width: '6',
    height: '1',
    attributeName: 'species',
    component: 'ManyToOne'
  },
  featurePath: '/assets/features/components/many-to-one-control.feature',
  fallbackFeature: `Feature: Many To One Control Component
  As a veterinary staff member
  I want an asynchronous typeahead lookup for related foreign key entities
  So that I can search and select related records accurately

  @showcase @many-to-one-control
  Scenario: Display typeahead search lookup in edit and view modes
    When I navigate to "/showcase/many-to-one-control"
    Then the showcase header should display "ManyToOneControlComponent"
    And the many to one input should be visible
    When I click the showcase button "btn-mode-view"
    Then the many to one view should be visible
    When I click the showcase button "btn-mode-edit"
    Then the many to one input should be visible`
};
