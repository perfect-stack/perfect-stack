Feature: Button Tabs Tool Component
  As a clinician reviewing multi-view patient records
  I want segmented button tabs to switch between sub-templates
  So that layout outlets dynamically load and display template views

  @showcase @button-tabs-tool
  Scenario: Display button tabs tool
    When I navigate to "/showcase/button-tabs-tool"
    Then the showcase header should display "ButtonTabsToolComponent"
    And the button tabs tool should be visible
