import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';
import { ToolType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Diagnostic Tools
// -------------------------------------------------------------------------
export const treeToolRegistration: ShowcaseItem = {
  id: 'tree-tool',
  name: 'TreeToolComponent',
  selector: '<lib-tree-tool>',
  category: 'Diagnostic Tools',
  description: 'Hierarchical taxonomy tree navigation tool. Queries backend recursive tree endpoints and renders collapsible/expandable nodes with master-detail capability.',
  attribute: {
    name: 'tree',
    label: 'Taxonomy Tree',
    description: 'Hierarchical recursive tree',
    type: AttributeType.Text,
    visibility: VisibilityType.Visible,
    comparisonField: '',
    comparisonOperator: ComparisonOperator.Equals,
    relationshipTarget: 'Species',
    typeaheadSearch: [],
    discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
    rules: [],
    enumeration: [],
    unitOfMeasure: '',
    scale: '',
  },
  cell: {
    width: '12',
    height: '3',
    tool: {
      type: ToolType.Tree,
      metaEntityName: 'Species',
      initialDepth: 3,
      initialExpandDepth: 1
    } as any
  },
  initialValue: 3,
  samplePresets: [
    { label: 'Species Taxonomy (Depth 3)', value: 3 },
    { label: 'Species Taxonomy (Depth 1)', value: 1 }
  ],
  docProperties: [
    { property: 'Tool Type', description: 'ToolType.Tree' },
    { property: 'Target MetaEntity', description: 'Binds to recursive tree entity (e.g. Species) with parent/children hierarchy.' },
    { property: 'Toolbar Actions', description: 'Provides "Expand All" and "Collapse All" global controls.' },
    { property: 'Master-Detail', description: 'Optionally integrates with master-detail panel for node inspection.' }
  ],
  metaPageJson: {
    width: '12',
    height: '3',
    tool: {
      type: ToolType.Tree,
      metaEntityName: 'Species',
      initialDepth: 3,
      initialExpandDepth: 1
    }
  },
  featurePath: '/assets/features/components/tree-tool.feature',
  fallbackFeature: `Feature: Tree Tool Component
  As a taxonomy researcher or clinician
  I want an interactive hierarchical tree view
  So that I can explore nested relationships and classify species

  @showcase @tree-tool
  Scenario: Display hierarchical tree navigation
    When I navigate to "/showcase/tree-tool"
    Then the showcase header should display "TreeToolComponent"
    And the tree tool should be visible
    When I click the showcase button "btn-mode-view"
    Then the tree tool should be visible
    When I click the showcase button "btn-mode-edit"
    Then the tree tool should be visible`
};
