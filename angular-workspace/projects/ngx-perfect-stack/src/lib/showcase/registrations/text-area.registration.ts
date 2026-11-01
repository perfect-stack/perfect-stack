import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

export const textAreaRegistration: ShowcaseItem = {
      id: 'text-area',
      name: 'TextAreaControlComponent',
      selector: '<lib-text-area-control>',
      category: 'Inputs & Primitives',
      description: 'Multi-line rich text editor powered by TinyMCE in edit mode, rendering sanitized HTML or fallback plain text in view mode.',
      attribute: {
        name: 'sample_notes',
        label: 'Clinical Notes',
        description: 'Multi-line notes attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Visible,
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
        height: '4',
        attributeName: 'sample_notes',
        component: 'TextArea',
      },
      initialValue: '<p>Patient exhibited normal vital signs. <strong>Follow up in 2 weeks.</strong></p>',
      samplePresets: [
        { label: 'Routine Exam', value: '<p>Routine exam completed. No concerns noted.</p>' },
        { label: 'Triage Note', value: '<p><strong>Priority 1:</strong> Immediate hydration required.</p>' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Text, Html' },
        { property: 'Height Calculation', description: 'Dynamically computes height from cell.height (cssHeight = 6 + (height-1)*3 + 1).' },
        { property: 'Edit Mode', description: 'Integrates TinyMCE rich editor (<editor>) with formatting toolbars.' },
        { property: 'View Mode', description: 'Renders sanitized [innerHTML] container.' }
      ],
      metaPageJson: { width: '12', height: '4', attributeName: 'notes', component: 'TextArea' },
      featurePath: '/assets/features/components/text-area.feature',
      fallbackFeature: `Feature: Text Area Control Component
  As a user writing extensive notes or descriptions
  I want a multi-line text area component that supports editing and formatted viewing
  So that longer text and rich formatting can be captured and reviewed comfortably

  Scenario: Display multi-line text in edit and view modes
    When I navigate to "/showcase/text-area"
    Then the showcase header should display "TextAreaControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the text area should display formatted view text
    When I click the showcase button "btn-mode-edit"
    Then the text area editor should be visible`
    };
