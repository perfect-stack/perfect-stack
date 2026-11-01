import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

export const selectControlRegistration: ShowcaseItem = {
      id: 'select-control',
      name: 'SelectControlComponent',
      selector: '<lib-select-control>',
      category: 'Selections & Badges',
      description: 'Single-select relational dropdown that queries an entity dataset via DataService.findAll() and binds the selected record foreign key (e.g. species_id) with searchable display text.',
      attribute: {
        name: 'species',
        label: 'Species',
        description: 'Taxonomic classification of the patient',
        type: AttributeType.ManyToOne,
        visibility: VisibilityType.Required,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        relationshipTarget: 'Species',
        typeaheadSearch: ['scientific_name', 'common_name'],
        discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
        rules: [],
        enumeration: [],
        unitOfMeasure: '',
        scale: '',
      },
      cell: {
        width: '6',
        height: '1',
        attributeName: 'species',
        component: 'Select',
      },
      initialValue: '85d08cf5-aa6d-4b36-8701-44121892aa48',
      samplePresets: [
        { label: 'Mammalia (Mammals)', value: '85d08cf5-aa6d-4b36-8701-44121892aa48' },
        { label: 'Aves (Birds)', value: '66bc9d74-0092-4b3e-a5ae-7b7f52b0837b' },
        { label: 'Animalia (Animals)', value: '56f05f10-5334-4904-adef-72ac2031a995' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'ManyToOne relational foreign key identifier' },
        { property: 'Dynamic Data Loading', description: 'Fetches option list via DataService.findAll(relationshipTarget).' },
        { property: 'Search & Formatting', description: 'Formats options using typeaheadSearch fields or default name.' },
        { property: 'View Mode', description: 'Resolves entity via cache/findById and displays formatted label in a read-only input.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'species', component: 'Select' },
      featurePath: '/assets/features/components/select-control.feature',
      fallbackFeature: `Feature: Select Control Component
  As a veterinary staff member
  I want a relational dropdown selector that dynamically loads entity records
  So that I can select a related entity accurately

  @showcase @select-control
  Scenario: Select related entity and switch between edit and view modes
    When I navigate to "/showcase/select-control"
    Then the showcase header should display "SelectControlComponent"
    And the select control dropdown should be visible
    When I click the showcase button "btn-mode-view"
    Then the select control view should display formatted text
    When I click the showcase button "btn-mode-edit"
    Then the select control dropdown should be visible`
    };
