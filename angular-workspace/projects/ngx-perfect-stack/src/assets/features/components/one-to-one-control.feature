Feature: One To One Control Component
  As a user managing complex records
  I want a nested 1:1 sub-form to inspect and edit tightly coupled child entities
  So that child entity attributes are modified directly inside the parent page

  @showcase @one-to-one-control
  Scenario: Display nested one-to-one sub-form
    When I navigate to "/showcase/one-to-one-control"
    Then the showcase header should display "OneToOneControlComponent"
    And the one to one control should be visible
    When I click the showcase button "btn-mode-view"
    Then the one to one control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the one to one control should be visible
