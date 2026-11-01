Feature: One To Poly Control Component
  As a clinician working with polymorphic records
  I want polymorphic card containers to display diverse entity types
  So that specialized card views adapt to each underlying child entity

  @showcase @one-to-poly-control
  Scenario: Display polymorphic card container
    When I navigate to "/showcase/one-to-poly-control"
    Then the showcase header should display "OneToPolyControlComponent"
    And the one to poly control should be visible
    When I click the showcase button "btn-mode-view"
    Then the one to poly control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the one to poly control should be visible
