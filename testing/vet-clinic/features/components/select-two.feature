Feature: Select Two Control Component
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
    And the select two secondary dropdown should not contain option "Dr. Emily Brown (Senior Surgeon)"
