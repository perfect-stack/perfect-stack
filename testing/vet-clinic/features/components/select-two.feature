Feature: Select Two Control Component
  As a veterinary user recording multi-level categorizations
  I want a compound selector with primary and secondary controls
  So that hierarchical choices can be made together in a clean row

  @showcase @select-two
  Scenario: Display compound primary and secondary dropdowns in edit and view modes
    When I navigate to "/showcase/select-two"
    Then the showcase header should display "SelectTwoControlComponent"
    And the select two primary dropdown should be visible
    When I click the showcase button "btn-mode-view"
    Then the select two view should display formatted text
    When I click the showcase button "btn-mode-edit"
    Then the select two primary dropdown should be visible
