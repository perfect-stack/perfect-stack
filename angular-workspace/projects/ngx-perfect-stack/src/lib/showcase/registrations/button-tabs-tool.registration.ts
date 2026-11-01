import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';
import { ToolType } from '../../domain/meta.page';

export const buttonTabsToolRegistration: ShowcaseItem = {
      id: 'button-tabs-tool',
      name: 'ButtonTabsToolComponent',
      selector: '<lib-button-tabs-tool>',
      category: 'Action & Navigation Tools',
      description: 'Template and sub-page switcher driving layout outlets through segmented tab buttons. Integrates with MetaPageService to switch active templates dynamically.',
      attribute: {
        name: 'active_tab_template',
        label: 'Template Tab Switcher',
        description: 'Template tab selector attribute',
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
        height: '2',
        attributeName: 'active_tab_template',
        tool: {
          type: ToolType.ButtonTabs,
          channel: 'tabs',
          containerStyles: '',
          styles: 'btn btn-outline-primary',
          label: 'Clinical Media Views',
          modes: '',
          templateIndex: 0,
          template1: 'PetMediaSingle.tab',
          template2: 'PetMediaMultiple.tab'
        } as any
      },
      initialValue: 'PetMediaSingle.tab',
      samplePresets: [
        { label: 'Single Media View', value: 'PetMediaSingle.tab' },
        { label: 'Multiple Media Gallery', value: 'PetMediaMultiple.tab' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.ButtonTabs' },
        { property: 'Template Routing', description: 'Resolves page templates via MetaPageService.metaPageMap$.' },
        { property: 'Embedded Outlet', description: 'Switches template rendered in <lib-layout-outlet>.' },
        { property: 'Data Inspection', description: 'Auto-selects active tab based on presence of event data.' }
      ],
      metaPageJson: {
        width: '12',
        height: '2',
        tool: {
          type: 'ButtonTabs',
          channel: 'tabs',
          label: 'Clinical Media Views',
          template1: 'PetMediaSingle.tab',
          template2: 'PetMediaMultiple.tab'
        }
      },
      featurePath: '/assets/features/components/button-tabs-tool.feature',
      fallbackFeature: `Feature: Button Tabs Tool Component
  As a clinician reviewing multi-view patient records
  I want segmented button tabs to switch between sub-templates
  So that layout outlets dynamically load and display template views

  @showcase @button-tabs-tool
  Scenario: Display button tabs tool
    When I navigate to "/showcase/button-tabs-tool"
    Then the showcase header should display "ButtonTabsToolComponent"
    And the button tabs tool should be visible`
    };
