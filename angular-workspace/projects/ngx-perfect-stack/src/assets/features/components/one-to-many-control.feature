Feature: One To Many Control Component
  As a clinician reviewing patient records
  I want an embedded sub-table grid for one-to-many child collections
  So that child entity records can be inspected and updated in context

  @showcase @one-to-many-control
  Scenario: Display embedded one-to-many sub-table
    When I navigate to "/showcase/one-to-many-control"
    Then the showcase header should display "OneToManyControlComponent"
    And the one to many control should be visible
    When I click the showcase button "btn-mode-view"
    Then the one to many control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the one to many control should be visible
