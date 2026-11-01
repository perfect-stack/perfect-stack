Feature: Time Control Component
  As a user recording observation times and appointment hours
  I want a dedicated time picker with hours and minutes selection
  So that times can be specified cleanly without requiring a full date

  @showcase @time-control
  Scenario: Display time in edit and view modes
    When I navigate to "/showcase/time-control"
    Then the showcase header should display "TimeControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the time control view should display formatted time
    When I click the showcase button "btn-mode-edit"
    Then the time input should be visible
