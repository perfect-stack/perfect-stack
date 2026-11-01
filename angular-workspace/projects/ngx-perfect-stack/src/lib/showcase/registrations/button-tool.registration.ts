import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';
import { ToolType } from '../../domain/meta.page';
import { ActionType } from '../../domain/meta.role';

// -------------------------------------------------------------------------
// CATEGORY: Action & Navigation Tools
// -------------------------------------------------------------------------
export const buttonToolRegistration: ShowcaseItem = {
      id: 'button-tool',
      name: 'ButtonToolComponent',
      selector: '<lib-button-tool>',
      category: 'Action & Navigation Tools',
      description: 'Action trigger button rendered in layout cells or toolbars. Supports customizable styles, Material icons, channel event dispatching, and route navigation.',
      attribute: {
        name: 'button_action',
        label: 'Action Trigger',
        description: 'Action trigger tool attribute',
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
        attributeName: 'button_action',
        tool: {
          type: ToolType.Button,
          channel: 'default',
          containerStyles: '',
          styles: 'btn btn-primary',
          label: 'Save Patient Record',
          modes: '',
          action: 'save',
          route: '',
          icon: 'save',
          actionPermit: ActionType.Edit,
          subjectPermit: 'Pet'
        } as any
      },
      initialValue: 'save',
      samplePresets: [
        { label: 'Save Record', value: 'save' },
        { label: 'Submit Consultation', value: 'submit' },
        { label: 'Cancel', value: 'cancel' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.Button' },
        { property: 'Event Dispatching', description: 'Dispatches onAction events to EventService via channel.' },
        { property: 'Route Navigation', description: 'Supports route expressions evaluated against ctx.dataMap.' },
        { property: 'Styling & Icons', description: 'Custom CSS classes and Material Symbols icon integration.' }
      ],
      metaPageJson: {
        width: '4',
        height: '1',
        tool: {
          type: 'Button',
          channel: 'default',
          styles: 'btn btn-primary',
          label: 'Save Patient Record',
          action: 'save',
          icon: 'save'
        }
      },
      featurePath: '/assets/features/components/button-tool.feature',
      fallbackFeature: `Feature: Button Tool Component
  As an application user or clinician
  I want interactive action buttons in page layouts and toolbars
  So that I can trigger actions, save records, and navigate routes

  @showcase @button-tool
  Scenario: Display and inspect button tool in edit and view modes
    When I navigate to "/showcase/button-tool"
    Then the showcase header should display "ButtonToolComponent"
    And the button tool should be visible with label "Save Patient Record"
    When I click the showcase button "btn-mode-view"
    Then the button tool should be visible with label "Save Patient Record"
    When I click the showcase button "btn-mode-edit"
    Then the button tool should be visible with label "Save Patient Record"`
    };
