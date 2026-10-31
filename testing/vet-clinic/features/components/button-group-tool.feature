Feature: Button Group Tool Component
  As a clinician reviewing timeline data
  I want segmented radio buttons to switch between timeframes or action modes
  So that I can quickly filter and toggle views

  @showcase @button-group-tool
  Scenario: Display and toggle options in button group tool
    When I navigate to "/showcase/button-group-tool"
    Then the showcase header should display "ButtonGroupToolComponent"
    And the button group tool should display button "Day"
    And the button group tool should display button "Week"
    And the button group tool should display button "Month"
    When I click button group button "Week"
    Then button group button "Week" should be active
