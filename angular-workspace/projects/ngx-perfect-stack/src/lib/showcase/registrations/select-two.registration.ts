import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

export const selectTwoRegistration: ShowcaseItem = {
      id: 'select-two',
      name: 'SelectTwoControlComponent',
      selector: '<lib-select-two-control>',
      category: 'Selections & Badges',
      description: 'Compound two-level selector combining a primary ManyToOne entity dropdown and a secondary dependent enumeration dropdown. Selecting a clinic dynamically populates its staff members in the secondary list.',
      attribute: {
        name: 'clinic',
        label: 'Clinic & Staff Member',
        description: 'Primary clinic with dependent staff member selection',
        type: AttributeType.ManyToOne,
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
        width: '12',
        height: '1',
        attributeName: 'clinic',
        component: 'SelectTwo',
        componentData: {
          secondaryAttributeName: 'staff_member',
          optionsMap: {
            'PETVET Lower Hutt': [
              'Dr. Sarah Smith (Lead Vet)',
              'Nurse Tom Evans',
              'Dr. Jack Wilson'
            ],
            'cf756f73-7a1a-4b86-9cd5-367649f19874': [
              'Dr. Sarah Smith (Lead Vet)',
              'Nurse Tom Evans',
              'Dr. Jack Wilson'
            ],
            'Central Hutt Vets': [
              'Dr. Emily Brown (Senior Surgeon)',
              'Nurse Chloe Davis',
              'Dr. Alan Walker'
            ],
            '7efa6559-4cc2-4ecb-85f6-3c6d3be069dc': [
              'Dr. Emily Brown (Senior Surgeon)',
              'Nurse Chloe Davis',
              'Dr. Alan Walker'
            ],
            'Animal Health Centre': [
              'Dr. Bruce Banner (Specialist)',
              'Nurse Natasha Romanoff'
            ],
            '0efa743d-1115-46ad-8055-9b7968d08a52': [
              'Dr. Bruce Banner (Specialist)',
              'Nurse Natasha Romanoff'
            ],
            'Animates Vetcare Clinic': [
              'Dr. Peter Parker (Avian & Exotic)',
              'Nurse Mary Jane'
            ],
            '9347b91d-29f6-4bf4-b204-4894a9935cce': [
              'Dr. Peter Parker (Avian & Exotic)',
              'Nurse Mary Jane'
            ]
          }
        }
      },
      initialValue: 'cf756f73-7a1a-4b86-9cd5-367649f19874',
      initialSecondaryValue: 'Dr. Sarah Smith (Lead Vet)',
      samplePresets: [
        { label: 'PETVET Lower Hutt', value: 'cf756f73-7a1a-4b86-9cd5-367649f19874' },
        { label: 'Central Hutt Vets', value: '7efa6559-4cc2-4ecb-85f6-3c6d3be069dc' },
        { label: 'Animal Health Centre', value: '0efa743d-1115-46ad-8055-9b7968d08a52' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'ManyToOne compound binding with secondary dependent attribute' },
        { property: 'Two-Column Layout', description: 'Renders primary <lib-select-control> and secondary <lib-enumeration-control> side by side.' },
        { property: 'Dependent Cascading', description: 'When primary entity changes, secondary dropdown options update from entity attribute or componentData.optionsMap.' },
        { property: 'Staff Selection Scenario', description: 'Selecting a clinic dynamically populates staff members for that clinic without altering the Clinic database schema.' },
        { property: 'View Mode', description: 'Renders read-only controls or combined text depending on labelLayout.' }
      ],
      metaPageJson: {
        width: '12',
        height: '1',
        attributeName: 'clinic',
        component: 'SelectTwo',
        componentData: {
          secondaryAttributeName: 'staff_member',
          optionsMap: {
            'PETVET Lower Hutt': ['Dr. Sarah Smith (Lead Vet)', 'Nurse Tom Evans', 'Dr. Jack Wilson'],
            'Central Hutt Vets': ['Dr. Emily Brown (Senior Surgeon)', 'Nurse Chloe Davis', 'Dr. Alan Walker'],
            'Animal Health Centre': ['Dr. Bruce Banner (Specialist)', 'Nurse Natasha Romanoff'],
            'Animates Vetcare Clinic': ['Dr. Peter Parker (Avian & Exotic)', 'Nurse Mary Jane']
          }
        }
      },
      featurePath: '/assets/features/components/select-two.feature',
      fallbackFeature: `Feature: Select Two Control Component
  As a veterinary user recording multi-level categorizations
  I want a compound selector with primary and secondary controls
  So that hierarchical choices can be made together in a clean row

  @showcase @select-two
  Scenario: Display compound primary and secondary dropdowns in edit and view modes
    When I navigate to "/showcase/select-two"
    Then the showcase header should display "SelectTwoControlComponent"
    And the select two primary dropdown should be visible
    And the select two secondary dropdown should contain option "Dr. Sarah Smith (Lead Vet)"
    When I click the showcase button "btn-mode-view"
    Then the select two view should display formatted text
    When I click the showcase button "btn-mode-edit"
    Then the select two primary dropdown should be visible

  @showcase @select-two
  Scenario: Changing primary clinic updates the secondary staff member options
    When I navigate to "/showcase/select-two"
    Then the select two secondary dropdown should contain option "Dr. Sarah Smith (Lead Vet)"
    When I select clinic "Central Hutt Vets" in the select two primary dropdown
    Then the select two secondary dropdown should contain option "Dr. Emily Brown (Senior Surgeon)"
    And the select two secondary dropdown should not contain option "Dr. Sarah Smith (Lead Vet)"
    When I select clinic "Animal Health Centre" in the select two primary dropdown
    Then the select two secondary dropdown should contain option "Dr. Bruce Banner (Specialist)"
    And the select two secondary dropdown should not contain option "Dr. Emily Brown (Senior Surgeon)"`
    };
