import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';
import { ToolType } from '../../domain/meta.page';

export const textToolRegistration: ShowcaseItem = {
      id: 'text-tool',
      name: 'TextToolComponent',
      selector: '<lib-text-tool>',
      category: 'Presentation Tools',
      description: 'Evaluated presentation text banner that renders static text or dynamic expressions computed against formGroup and dataMap.',
      attribute: {
        name: 'presentation_text',
        label: 'Banner Text',
        description: 'Presentation banner text attribute',
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
        attributeName: 'presentation_text',
        tool: {
          type: ToolType.TextTool,
          channel: '',
          containerStyles: '',
          styles: 'alert alert-info py-2 px-3 fw-bold mb-0',
          label: 'Status Banner',
          modes: '',
          text: 'Patient Status: Registered and Active in System'
        } as any
      },
      initialValue: 'Patient Status: Registered and Active in System',
      samplePresets: [
        { label: 'Active Banner', value: 'Patient Status: Registered and Active in System' },
        { label: 'Alert Banner', value: 'Alert: Scheduled for follow-up vaccination' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.TextTool' },
        { property: 'Expression Evaluation', description: 'Evaluates text template expressions against formGroup or dataMap.' },
        { property: 'Dynamic Styling', description: 'Applies CSS classes dynamically via expressionService.' },
        { property: 'Presentation Slot', description: 'Ideal for headings, contextual alerts, instructions, and dividers.' }
      ],
      metaPageJson: {
        width: '12',
        height: '1',
        tool: {
          type: 'TextTool',
          styles: 'alert alert-info py-2 px-3 fw-bold mb-0',
          text: 'Patient Status: Registered and Active in System'
        }
      },
      featurePath: '/assets/features/components/text-tool.feature',
      fallbackFeature: `Feature: Text Tool Component
  As a form designer or clinician
  I want contextual text banners and messages rendered inside form layouts
  So that important instructions, statuses, and alerts are highlighted

  @showcase @text-tool
  Scenario: Display presentation text banner
    When I navigate to "/showcase/text-tool"
    Then the showcase header should display "TextToolComponent"
    And the text tool banner should display "Patient Status: Registered and Active in System"`
    };
