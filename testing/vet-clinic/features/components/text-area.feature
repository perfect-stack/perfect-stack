Feature: Text Area Control Component
  As a user writing extensive notes or descriptions
  I want a multi-line text area component that supports editing and formatted viewing
  So that longer text and rich formatting can be captured and reviewed comfortably

  @showcase @text-area
  Scenario: Display multi-line text in edit and view modes
    When I navigate to "/showcase/text-area"
    Then the showcase header should display "TextAreaControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the text area should display formatted view text
    When I click the showcase button "btn-mode-edit"
    Then the text area editor should be visible
