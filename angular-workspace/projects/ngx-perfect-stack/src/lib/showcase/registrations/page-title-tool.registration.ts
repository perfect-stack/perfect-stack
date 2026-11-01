import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';
import { ToolType } from '../../domain/meta.page';

// -------------------------------------------------------------------------
// CATEGORY: Presentation Tools
// -------------------------------------------------------------------------
export const pageTitleToolRegistration: ShowcaseItem = {
      id: 'page-title-tool',
      name: 'PageTitleToolComponent',
      selector: '<lib-page-title-tool>',
      category: 'Presentation Tools',
      description: 'Contextual page title header rendering dynamic titles based on page mode (search, add, view, update) or static titles from metaPage.title.',
      attribute: {
        name: 'page_title',
        label: 'Page Heading',
        description: 'Page title tool attribute',
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
        attributeName: 'page_title',
        tool: {
          type: ToolType.PageTitle,
          channel: '',
          containerStyles: '',
          styles: '',
          label: 'Page Title',
          modes: '',
          nameAttributes: ''
        } as any
      },
      initialValue: 'Patient Clinical Record',
      samplePresets: [
        { label: 'Static Title', value: '' },
        { label: 'Dynamic Name (Pet)', value: 'name' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.PageTitle' },
        { property: 'Mode Adaptation', description: 'Automatically prefixes titles: "Search [Entity]", "Add [Entity]", "Update [Entity]".' },
        { property: 'Static Fallback', description: 'Renders ctx.metaPage.title when nameAttributes is not configured.' },
        { property: 'Editor Support', description: 'Provides click-to-edit integration for PropertySheetService in editor mode.' }
      ],
      metaPageJson: {
        width: '12',
        height: '1',
        tool: {
          type: 'PageTitle',
          nameAttributes: ''
        }
      },
      featurePath: '/assets/features/components/page-title-tool.feature',
      fallbackFeature: `Feature: Page Title Tool Component
  As a user navigating application pages
  I want contextual page titles that clearly reflect the active page and mode
  So that I understand what entity and action I am working on

  @showcase @page-title-tool
  Scenario: Display contextual page title in edit and view modes
    When I navigate to "/showcase/page-title-tool"
    Then the showcase header should display "PageTitleToolComponent"
    And the page title heading should display "Showcase Preview"`
    };
