import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Inputs & Primitives
// -------------------------------------------------------------------------
export const textFieldRegistration: ShowcaseItem = {
      id: 'text-field',
      name: 'TextFieldControlComponent',
      selector: '<lib-text-field-control>',
      category: 'Inputs & Primitives',
      description: 'Universal text and numerical input widget. Renders an editable input with scale/UoM formatting and validation indicators in "edit" mode, or a formatted read-only span in "view" mode.',
      attribute: {
        name: 'sample_text',
        label: 'Sample Field',
        description: 'A demonstration attribute for TextFieldControl',
        type: AttributeType.Text,
        visibility: VisibilityType.Required,
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
        attributeName: 'sample_text',
        component: 'TextField',
      },
      initialValue: 'Fido',
      samplePresets: [
        { label: '"Max"', value: 'Max' },
        { label: '"Golden Retriever"', value: 'Golden Retriever' },
        { label: '"125.50"', value: '125.50' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Text, Integer, Double, Html' },
        { property: 'Accessor Behavior', description: 'Implements ControlValueAccessor, syncs with NgControl.' },
        { property: 'Edit Mode', description: 'Renders <input class="form-control"> with live scale formatting.' },
        { property: 'View Mode', description: 'Renders read-only <span> with UOM suffix or dash if empty.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'given_name', component: 'TextField' },
      featurePath: '/assets/features/components/text-field.feature',
      fallbackFeature: `Feature: Text Field Control Component
  As a developer and user of ngx-perfect-stack
  I want a versatile text field component that adapts to edit and view modes and provides validation feedback
  So that users can enter and inspect text data reliably

  Scenario: Display and edit text in the Component Showcase
    When I navigate to "/showcase/text-field"
    Then the showcase header should display "TextFieldControlComponent"
    And the text field input should contain "Fido"
    When I enter "Rex" into the text field input
    Then the text field input should contain "Rex"
    And the form state inspector should show value "Rex"

  Scenario: Switching between edit and view modes
    When I navigate to "/showcase/text-field"
    When I click the showcase button "btn-mode-view"
    Then the text field should display read-only text "Fido"
    When I click the showcase button "btn-mode-edit"
    Then the text field input should contain "Fido"

  Scenario: Validation error appearance and clearance
    When I navigate to "/showcase/text-field"
    When I click the showcase button "btn-trigger-error"
    Then the text field should show validation error styling
    And the text field should display validation message "Attribute required"
    And the form state inspector status should be "INVALID"
    When I click the showcase button "btn-clear-error"
    Then the text field should not show validation error styling
    And the form state inspector status should be "VALID"`
    };
