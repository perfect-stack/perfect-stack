Feature: Pipe List Control Component
  As a veterinary clinician
  I want to select multiple tags stored as a pipe-delimited string
  So that complex categorizations can be tagged and untagged interactively

  @showcase @pipe-list
  Scenario: Add and remove pipe-delimited tags in edit and view modes
    When I navigate to "/showcase/pipe-list"
    Then the showcase header should display "PipeListControlComponent"
    And the pipe list should contain selected tag "Urgent"
    And the pipe list should contain selected tag "Surgery"
    When I add tag "Vaccination" to the pipe list
    Then the pipe list should contain selected tag "Vaccination"
    Then the form state inspector should show value "Urgent|Surgery|Vaccination"
    When I click the showcase button "btn-mode-view"
    Then the pipe list view should contain tag "Urgent"
    And the pipe list view should contain tag "Vaccination"
    When I click the showcase button "btn-mode-edit"
    When I remove tag "Urgent" from the pipe list
    Then the form state inspector should show value "Surgery|Vaccination"
