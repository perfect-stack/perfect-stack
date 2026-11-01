Feature: Many To One Control Component
  As a veterinary staff member
  I want an asynchronous typeahead lookup for related foreign key entities
  So that I can search and select related records accurately

  @showcase @many-to-one-control
  Scenario: Display typeahead search lookup in edit and view modes
    When I navigate to "/showcase/many-to-one-control"
    Then the showcase header should display "ManyToOneControlComponent"
    And the many to one input should be visible
    When I click the showcase button "btn-mode-view"
    Then the many to one view should be visible
    When I click the showcase button "btn-mode-edit"
    Then the many to one input should be visible
