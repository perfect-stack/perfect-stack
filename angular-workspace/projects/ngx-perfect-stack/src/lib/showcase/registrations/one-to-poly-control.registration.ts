import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

// -------------------------------------------------------------------------
// CATEGORY: Relational Controls
// -------------------------------------------------------------------------
export const oneToPolyControlRegistration: ShowcaseItem = {
  id: 'one-to-poly-control',
  name: 'OneToPolyControlComponent',
  selector: '<lib-one-to-poly-control>',
  category: 'Relational Controls',
  description: 'Polymorphic relationship card container. Hosts dynamic card views dispatching polymorphic entity types and metadata mappings.',
  attribute: {
    name: 'poly_attachments',
    label: 'Polymorphic Attachments',
    description: 'Polymorphic relation container',
    type: AttributeType.OneToPoly,
    visibility: VisibilityType.Visible,
    comparisonField: '',
    comparisonOperator: ComparisonOperator.Equals,
    relationshipTarget: 'Attachment',
    typeaheadSearch: [],
    discriminator: {
      discriminatorName: 'item_type',
      discriminatorType: 'string',
      entityMappingList: []
    },
    rules: [],
    enumeration: [],
    unitOfMeasure: '',
    scale: '',
  },
  cell: {
    width: '12',
    height: '2',
    attributeName: 'poly_attachments',
    component: 'OneToPoly',
    noItemsHtml: '<div class="alert alert-secondary py-2 mb-0">No polymorphic attachments configured.</div>'
  },
  initialValue: [],
  samplePresets: [
    { label: 'Empty Collection', value: [] }
  ],
  docProperties: [
    { property: 'Supported Type', description: 'AttributeType.OneToPoly' },
    { property: 'Polymorphic Layout', description: 'Hosts CardLayoutComponent evaluating dynamic discriminator mappings.' },
    { property: 'Discriminator Mapping', description: 'Resolves polymorphic child types via DiscriminatorService.' },
    { property: 'Item Actions', description: 'Supports adding items via CardItemDialog and removing card rows in edit mode.' }
  ],
  metaPageJson: {
    width: '12',
    height: '2',
    attributeName: 'poly_attachments',
    component: 'OneToPoly'
  },
  featurePath: '/assets/features/components/one-to-poly-control.feature',
  fallbackFeature: `Feature: One To Poly Control Component
  As a clinician working with polymorphic records
  I want polymorphic card containers to display diverse entity types
  So that specialized card views adapt to each underlying child entity

  @showcase @one-to-poly-control
  Scenario: Display polymorphic card container
    When I navigate to "/showcase/one-to-poly-control"
    Then the showcase header should display "OneToPolyControlComponent"
    And the one to poly control should be visible
    When I click the showcase button "btn-mode-view"
    Then the one to poly control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the one to poly control should be visible`
};
