Feature: Boolean Checkbox Control Component
  As a user filling out a form with toggle options
  I want a checkbox control that clearly indicates Yes/No states in edit and view modes
  So that binary flags are unambiguous to users

  @showcase @boolean-checkbox
  Scenario: Toggle checkbox and inspect view mode
    When I navigate to "/showcase/boolean-checkbox"
    Then the showcase header should display "BooleanCheckBoxControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the boolean checkbox view should display "Yes"
    When I click the showcase button "btn-mode-edit"
    Then the checkbox element should be visible and checked
