import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';
import { ToolType } from '@perfect-stack/ngx-perfect-stack';

export const buttonGroupToolRegistration: ShowcaseItem = {
      id: 'button-group-tool',
      name: 'ButtonGroupToolComponent',
      selector: '<lib-button-group-tool>',
      category: 'Action & Navigation Tools',
      description: 'Multi-button segmented radio toggle group. Splits comma-delimited labels and actions into an interactive button strip with active state tracking.',
      attribute: {
        name: 'button_group_selection',
        label: 'Segmented Action Group',
        description: 'Segmented radio button group attribute',
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
        width: '6',
        height: '1',
        attributeName: 'button_group_selection',
        tool: {
          type: ToolType.ButtonGroup,
          channel: 'timeframe',
          containerStyles: '',
          styles: 'btn btn-outline-secondary',
          label: 'Day,Week,Month,Year',
          modes: '',
          action: 'day,week,month,year',
          route: ''
        } as any
      },
      initialValue: 'Day',
      samplePresets: [
        { label: 'Day / Week / Month', value: 'Day,Week,Month' },
        { label: 'Morning / Afternoon / Evening', value: 'Morning,Afternoon,Evening' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.ButtonGroup' },
        { property: 'Delimited Parsing', description: 'Splits comma-separated label and action strings into buttons.' },
        { property: 'Radio Group', description: 'Renders Bootstrap .btn-group with active selection styling.' },
        { property: 'Event Emission', description: 'Emits action event and dispatches to EventService on selection.' }
      ],
      metaPageJson: {
        width: '6',
        height: '1',
        tool: {
          type: 'ButtonGroup',
          channel: 'timeframe',
          styles: 'btn btn-outline-secondary',
          label: 'Day,Week,Month,Year',
          action: 'day,week,month,year'
        }
      },
      featurePath: '/assets/features/components/button-group-tool.feature',
      fallbackFeature: `Feature: Button Group Tool Component
  As a clinician reviewing timeline data
  I want segmented radio buttons to switch between timeframes or action modes
  So that I can quickly filter and toggle views

  @showcase @button-group-tool
  Scenario: Display and toggle options in button group tool
    When I navigate to "/showcase/button-group-tool"
    Then the showcase header should display "ButtonGroupToolComponent"
    And the button group tool should display button "Day"
    And the button group tool should display button "Week"
    And the button group tool should display button "Month"
    When I click button group button "Week"
    Then button group button "Week" should be active`
    };
