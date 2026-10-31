Feature: Date Time Control Component
  As a user scheduling visits or recording timestamped observations
  I want a combined date and time picker that handles calendar selection and time of day
  So that timestamps are accurately represented in ISO-8601 format

  @showcase @date-time
  Scenario: Display date time in edit and view modes
    When I navigate to "/showcase/date-time"
    Then the showcase header should display "DateTimeControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the date time view should display formatted date and time
    When I click the showcase button "btn-mode-edit"
    Then the date time input should be visible
