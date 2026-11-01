import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

export const booleanCheckboxRegistration: ShowcaseItem = {
      id: 'boolean-checkbox',
      name: 'BooleanCheckBoxControlComponent',
      selector: '<lib-boolean-check-box-control>',
      category: 'Inputs & Primitives',
      description: 'Binary toggle control rendering an accessible HTML5 checkbox in edit mode, and human-friendly "Yes" / "No" text in view mode.',
      attribute: {
        name: 'is_active',
        label: 'Active Record',
        description: 'Boolean flag attribute',
        type: AttributeType.Boolean,
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
        width: '4',
        height: '1',
        attributeName: 'is_active',
        component: 'Boolean',
      },
      initialValue: true,
      samplePresets: [
        { label: 'True / Yes', value: true },
        { label: 'False / No', value: false }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Boolean' },
        { property: 'Label Toggle', description: 'Supports hideLabel input / cell.hideLabel configuration for table layouts.' },
        { property: 'Edit Mode', description: 'Renders standard Bootstrap <input type="checkbox" class="form-check-input">.' },
        { property: 'View Mode', description: 'Outputs localized "Yes" or "No" display value.' }
      ],
      metaPageJson: { width: '4', height: '1', attributeName: 'is_active', component: 'Boolean' },
      featurePath: '/assets/features/components/boolean-checkbox.feature',
      fallbackFeature: `Feature: Boolean Checkbox Control Component
  As a user filling out a form with toggle options
  I want a checkbox control that clearly indicates Yes/No states in edit and view modes
  So that binary flags are unambiguous to users

  Scenario: Toggle checkbox and inspect view mode
    When I navigate to "/showcase/boolean-checkbox"
    Then the showcase header should display "BooleanCheckBoxControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the boolean checkbox view should display "Yes"
    When I click the showcase button "btn-mode-edit"
    Then the checkbox element should be visible and checked`
    };
