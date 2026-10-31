Feature: Text Field Control Component
  As a developer and user of ngx-perfect-stack
  I want a versatile text field component that adapts to edit and view modes and provides validation feedback
  So that users can enter and inspect text data reliably

  @showcase @text-field
  Scenario: Display and edit text in the Component Showcase
    When I navigate to "/showcase/text-field"
    Then the showcase header should display "TextFieldControlComponent"
    And the text field input should contain "Fido"
    When I enter "Rex" into the text field input
    Then the text field input should contain "Rex"
    And the form state inspector should show value "Rex"

  @showcase @text-field
  Scenario: Switching between edit and view modes
    When I navigate to "/showcase/text-field"
    When I click the showcase button "btn-mode-view"
    Then the text field should display read-only text "Fido"
    When I click the showcase button "btn-mode-edit"
    Then the text field input should contain "Fido"

  @showcase @text-field
  Scenario: Validation error appearance and clearance
    When I navigate to "/showcase/text-field"
    When I click the showcase button "btn-trigger-error"
    Then the text field should show validation error styling
    And the text field should display validation message "Attribute required"
    And the form state inspector status should be "INVALID"
    When I click the showcase button "btn-clear-error"
    Then the text field should not show validation error styling
    And the form state inspector status should be "VALID"
