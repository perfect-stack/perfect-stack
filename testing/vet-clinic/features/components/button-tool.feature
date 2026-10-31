Feature: Button Tool Component
  As an application user or clinician
  I want interactive action buttons in page layouts and toolbars
  So that I can trigger actions, save records, and navigate routes

  @showcase @button-tool
  Scenario: Display and inspect button tool in edit and view modes
    When I navigate to "/showcase/button-tool"
    Then the showcase header should display "ButtonToolComponent"
    And the button tool should be visible with label "Save Patient Record"
    When I click the showcase button "btn-mode-view"
    Then the button tool should be visible with label "Save Patient Record"
    When I click the showcase button "btn-mode-edit"
    Then the button tool should be visible with label "Save Patient Record"
