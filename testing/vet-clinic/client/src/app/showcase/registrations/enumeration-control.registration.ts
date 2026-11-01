import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Selections & Badges
// -------------------------------------------------------------------------
export const enumerationControlRegistration: ShowcaseItem = {
      id: 'enumeration-control',
      name: 'EnumerationControlComponent',
      selector: '<lib-enumeration-control>',
      category: 'Selections & Badges',
      description: 'Single-select dropdown widget populated from an enumerated list of choices. Renders a Bootstrap <select class="form-select"> in edit mode, and a read-only input in view mode.',
      attribute: {
        name: 'species_classification',
        label: 'Species Classification',
        description: 'Taxonomic class of animal',
        type: AttributeType.Enumeration,
        visibility: VisibilityType.Required,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        relationshipTarget: '',
        typeaheadSearch: [],
        discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
        rules: [],
        enumeration: ['Canine', 'Feline', 'Equine', 'Avian', 'Reptile'],
        unitOfMeasure: '',
        scale: '',
      },
      cell: {
        width: '6',
        height: '1',
        attributeName: 'species_classification',
        component: 'Enumeration',
      },
      initialValue: 'Canine',
      samplePresets: [
        { label: 'Canine', value: 'Canine' },
        { label: 'Feline', value: 'Feline' },
        { label: 'Avian', value: 'Avian' },
        { label: 'Clear', value: null }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Enumeration, Text' },
        { property: 'Options Source', description: 'Loaded from attribute.enumeration or dependent query via cell.dependsOn.' },
        { property: 'Edit Mode', description: 'Renders <select class="form-select"> with options from attribute.enumeration and blank null option.' },
        { property: 'View Mode', description: 'Renders read-only input showing selected value or &mdash; if empty.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'species_classification', component: 'Enumeration' },
      featurePath: '/assets/features/components/enumeration-control.feature',
      fallbackFeature: `Feature: Enumeration Control Component
  As a veterinary staff member or researcher
  I want a dropdown selector populated with defined enumeration choices
  So that data input is standardized and validated against allowed values

  Scenario: Display and select enumeration options in edit and view modes
    When I navigate to "/showcase/enumeration-control"
    Then the showcase header should display "EnumerationControlComponent"
    And the enumeration select should contain option "Canine"
    And the enumeration select should contain option "Feline"
    When I select "Feline" in the enumeration dropdown
    Then the form state inspector should show value "Feline"
    When I click the showcase button "btn-mode-view"
    Then the enumeration view should display "Feline"
    When I click the showcase button "btn-mode-edit"
    Then the enumeration select should contain option "Avian"`
    };
