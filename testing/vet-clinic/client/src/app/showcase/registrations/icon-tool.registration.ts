import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';
import { ToolType } from '@perfect-stack/ngx-perfect-stack';

export const iconToolRegistration: ShowcaseItem = {
      id: 'icon-tool',
      name: 'IconToolComponent',
      selector: '<lib-icon-tool>',
      category: 'Presentation Tools',
      description: 'Visual glyph tool displaying Google Material Symbols icons with evaluated styling and expression-driven icon names.',
      attribute: {
        name: 'status_icon',
        label: 'Visual Icon',
        description: 'Icon tool attribute',
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
        width: '4',
        height: '1',
        attributeName: 'status_icon',
        tool: {
          type: ToolType.Icon,
          channel: '',
          containerStyles: '',
          styles: 'text-primary fs-2',
          label: 'Clinic Icon',
          modes: '',
          iconName: 'pets'
        } as any
      },
      initialValue: 'pets',
      samplePresets: [
        { label: 'Pets (Paw)', value: 'pets' },
        { label: 'Medical (Cross)', value: 'medical_services' },
        { label: 'Hospital', value: 'local_hospital' },
        { label: 'Vaccine', value: 'vaccines' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.Icon' },
        { property: 'Icon Font', description: 'Uses Google Material Symbols Outlined font.' },
        { property: 'Dynamic Evaluation', description: 'Evaluates icon name and styles against form values.' },
        { property: 'Editor Integration', description: 'Supports ToolPaletteComponent defaults and PropertySheet editing.' }
      ],
      metaPageJson: {
        width: '4',
        height: '1',
        tool: {
          type: 'Icon',
          styles: 'text-primary fs-2',
          iconName: 'pets'
        }
      },
      featurePath: '/assets/features/components/icon-tool.feature',
      fallbackFeature: `Feature: Icon Tool Component
  As a user reviewing clinical dashboards and records
  I want prominent visual icons to identify categories and statuses at a glance
  So that visual cues reinforce important information

  @showcase @icon-tool
  Scenario: Display icon tool with Material Symbols
    When I navigate to "/showcase/icon-tool"
    Then the showcase header should display "IconToolComponent"
    And the icon tool should display icon "pets"`
    };
