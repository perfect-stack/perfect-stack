Feature: Enumeration Control Component
  As a veterinary staff member or researcher
  I want a dropdown selector populated with defined enumeration choices
  So that data input is standardized and validated against allowed values

  @showcase @enumeration-control
  Scenario: Display and select enumeration options in edit and view modes
    When I navigate to "/showcase/enumeration-control"
    Then the showcase header should display "EnumerationControlComponent"
    And the enumeration select should contain option "Canine"
    And the enumeration select should contain option "Feline"
    When I select "Feline" in the enumeration dropdown
    Then the form state inspector should show value "Feline"
    When I click the showcase button "btn-mode-view"
    Then the enumeration view should display "Feline"
    When I click the showcase button "btn-mode-edit"
    Then the enumeration select should contain option "Avian"
