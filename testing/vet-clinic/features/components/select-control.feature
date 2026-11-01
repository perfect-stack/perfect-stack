Feature: Select Control Component
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
    Then the select control dropdown should be visible
