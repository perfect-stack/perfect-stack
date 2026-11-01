Feature: Assertion List Control Component
  As a clinician recording patient observations
  I want a flexible assertion list to capture clinical measurements and facts
  So that patient health data is documented accurately in card or field layouts

  @showcase @assertion-list-control
  Scenario: Display clinical assertion list in edit and view modes
    When I navigate to "/showcase/assertion-list-control"
    Then the showcase header should display "AssertionListControlComponent"
    And the assertion list control should be visible
    When I click the showcase button "btn-mode-view"
    Then the assertion list control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the assertion list control should be visible
