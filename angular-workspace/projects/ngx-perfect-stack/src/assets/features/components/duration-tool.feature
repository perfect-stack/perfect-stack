Feature: Duration Tool Component
  As a clinician tracking patient procedures
  I want a calculated duration display
  So that I can see the elapsed time between start and end timestamps

  @showcase @duration-tool
  Scenario: Display calculated duration between timestamps
    When I navigate to "/showcase/duration-tool"
    Then the showcase header should display "DurationToolComponent"
    And the duration tool should be visible
    When I click the showcase button "btn-mode-view"
    Then the duration tool should be visible
    When I click the showcase button "btn-mode-edit"
    Then the duration tool should be visible
