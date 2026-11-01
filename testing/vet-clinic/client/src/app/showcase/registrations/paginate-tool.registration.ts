import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';
import { ToolType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Action & Navigation Tools
// -------------------------------------------------------------------------
export const paginateToolRegistration: ShowcaseItem = {
  id: 'paginate-tool',
  name: 'PaginateToolComponent',
  selector: '<lib-paginate-tool>',
  category: 'Action & Navigation Tools',
  description: 'Pagination toolbar control powered by ng-bootstrap. Tracks pageNumber, pageSize, and collectionSize against criteria forms and dispatches search navigation events.',
  attribute: {
    name: 'paginate',
    label: 'Pagination Control',
    description: 'Pagination tool attribute',
    type: AttributeType.Text,
    visibility: VisibilityType.Optional,
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
    attributeName: 'paginate',
    tool: {
      type: ToolType.Paginate,
      channel: 'pagination',
      containerStyles: '',
      styles: '',
      label: 'Page Navigation',
      modes: '',
      criteriaForm: 'criteria'
    } as any
  },
  initialValue: 1,
  samplePresets: [
    { label: 'Page 1 (50 items)', value: 1 },
    { label: 'Page 2 (50 items)', value: 2 },
    { label: 'Page 3 (50 items)', value: 3 }
  ],
  docProperties: [
    { property: 'Tool Type', description: 'ToolType.Paginate' },
    { property: 'Criteria Sync', description: 'Subscribes to criteriaForm value changes (pageNumber, pageSize, collectionSize).' },
    { property: 'Event Dispatching', description: 'Dispatches search action via EventService.dispatchOnAction.' },
    { property: 'UI Component', description: 'Uses <ngb-pagination> with First, Previous, Next, and Last templates.' }
  ],
  metaPageJson: {
    width: '12',
    height: '1',
    tool: {
      type: 'Paginate',
      channel: 'pagination',
      criteriaForm: 'criteria'
    }
  },
  featurePath: '/assets/features/components/paginate-tool.feature',
  fallbackFeature: `Feature: Paginate Tool Component
  As a user navigating large datasets
  I want a pagination control toolbar to jump between pages of results
  So that I can review paginated search listings efficiently

  @showcase @paginate-tool
  Scenario: Display pagination control toolbar in the Component Showcase
    When I navigate to "/showcase/paginate-tool"
    Then the showcase header should display "PaginateToolComponent"
    And the pagination tool should be visible
    When I click the showcase button "btn-mode-view"
    Then the pagination tool should be visible
    When I click the showcase button "btn-mode-edit"
    Then the pagination tool should be visible`
};
