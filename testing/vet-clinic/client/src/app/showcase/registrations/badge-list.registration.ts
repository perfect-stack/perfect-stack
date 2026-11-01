import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

export const badgeListRegistration: ShowcaseItem = {
      id: 'badge-list',
      name: 'BadgeListComponent',
      selector: '<lib-badge-list>',
      category: 'Selections & Badges',
      description: 'Read-only badge cluster widget that parses comma-delimited strings (e.g. "Vaccinated, Microchipped, Insured") into styled Bootstrap badges.',
      attribute: {
        name: 'pet_badges',
        label: 'Health & Status Badges',
        description: 'Comma-delimited status tags',
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
        width: '6',
        height: '1',
        attributeName: 'pet_badges',
        component: 'BadgeList',
      },
      initialValue: 'Vaccinated, Microchipped, Insured',
      samplePresets: [
        { label: 'Vaccinated & Insured', value: 'Vaccinated, Insured' },
        { label: 'All Badges', value: 'Vaccinated, Microchipped, Insured, Neutered' },
        { label: 'Quarantine', value: 'Quarantine, Isolation' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Text (comma-separated string)' },
        { property: 'Delimiter', description: 'Splits value by comma into individual badges.' },
        { property: 'Styling', description: 'Renders <div class="badge bg-secondary me-2"> for each badge.' },
        { property: 'Display Only', description: 'Displays badges across both edit and view modes.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'pet_badges', component: 'BadgeList' },
      featurePath: '/assets/features/components/badge-list.feature',
      fallbackFeature: `Feature: Badge List Component
  As a veterinary receptionist or nurse
  I want to view prominent badges summarizing pet status flags
  So that critical patient flags like vaccination or insurance status are immediately visible

  Scenario: Display comma-separated status badges in the Component Showcase
    When I navigate to "/showcase/badge-list"
    Then the showcase header should display "BadgeListComponent"
    And the badge list should display badge "Vaccinated"
    And the badge list should display badge "Microchipped"
    And the badge list should display badge "Insured"
    And the badge list should have 3 badges
    When I click the showcase button "btn-mode-view"
    Then the badge list should display badge "Vaccinated"`
    };
