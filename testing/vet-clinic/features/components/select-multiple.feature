Feature: Select Multiple Control Component
  As a veterinary nurse or receptionist
  I want a multi-select control that displays choices as removable badges
  So that multiple affiliations or options can be selected and managed cleanly

  @showcase @select-multiple
  Scenario: Manage multiple selected options with interactive tag badges
    When I navigate to "/showcase/select-multiple"
    Then the showcase header should display "SelectMultipleControlComponent"
    And the select multiple control should display selected tag "Central Hutt Vets"
    And the select multiple control should display selected tag "Animal Health Centre"
    When I click the showcase button "btn-mode-view"
    Then the select multiple view should display badge "Central Hutt Vets"
    And the select multiple view should display badge "Animal Health Centre"
    When I click the showcase button "btn-mode-edit"
    Then the select multiple control should display selected tag "Central Hutt Vets"
