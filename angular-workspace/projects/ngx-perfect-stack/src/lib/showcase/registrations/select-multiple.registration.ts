import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

export const selectMultipleRegistration: ShowcaseItem = {
      id: 'select-multiple',
      name: 'SelectMultipleControlComponent',
      selector: '<lib-select-multiple-control>',
      category: 'Selections & Badges',
      description: 'Multi-selection dropdown widget with interactive tag badges. Users can select multiple items from a relational entity dataset, remove tags with one click, and serialize values as comma-delimited strings.',
      attribute: {
        name: 'clinic_affiliations',
        label: 'Clinic Affiliations',
        description: 'Associated clinic branches',
        type: AttributeType.SelectMultiple,
        visibility: VisibilityType.Visible,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        relationshipTarget: 'Clinic',
        typeaheadSearch: ['name'],
        discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
        rules: [],
        enumeration: [],
        unitOfMeasure: '',
        scale: '',
      },
      cell: {
        width: '8',
        height: '1',
        attributeName: 'clinic_affiliations',
        component: 'SelectMultiple',
      },
      initialValue: 'Central Hutt Vets,Animal Health Centre',
      samplePresets: [
        { label: 'Central Hutt & Animal Health', value: 'Central Hutt Vets,Animal Health Centre' },
        { label: 'PETVET Lower Hutt', value: 'PETVET Lower Hutt' },
        { label: 'Animates Vetcare Clinic', value: 'Animates Vetcare Clinic' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'SelectMultiple (persisted as comma-separated entity name string)' },
        { property: 'Interactive Tags', description: 'Selected options appear as blue pill badges with close (X) remove buttons.' },
        { property: 'Dropdown Menu', description: 'ngbDropdown popup containing available choices from DataService.findAll().' },
        { property: 'View Mode', description: 'Renders selected tags as read-only badges or em-dash if empty.' }
      ],
      metaPageJson: { width: '8', height: '1', attributeName: 'clinic_affiliations', component: 'SelectMultiple' },
      featurePath: '/assets/features/components/select-multiple.feature',
      fallbackFeature: `Feature: Select Multiple Control Component
  As a veterinary nurse or receptionist
  I want a multi-select control that displays choices as removable badges
  So that multiple affiliations or options can be selected and managed cleanly

  @showcase @select-multiple
  Scenario: Manage multiple selected options with interactive tag badges
    When I navigate to "/showcase/select-multiple"
    Then the showcase header should display "SelectMultipleControlComponent"
    And the select multiple control should display selected tag "Central Hutt Vets"
    And the select multiple control should display selected tag "Animal Health Centre"
    When I click the showcase button "btn-mode-view"
    Then the select multiple view should display badge "Central Hutt Vets"
    And the select multiple view should display badge "Animal Health Centre"
    When I click the showcase button "btn-mode-edit"
    Then the select multiple control should display selected tag "Central Hutt Vets"`
    };
