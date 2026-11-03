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

  @showcase @date-time
  Scenario: Switch date time precision to DateOnly
    When I navigate to "/showcase/date-time"
    And I click the showcase button "btn-precision-date-only"
    Then the time input should not be visible
    When I click the showcase button "btn-mode-view"
    Then the date time view should display formatted date

  @showcase @date-time
  Scenario: Optional time reveals time input on clock button click
    When I navigate to "/showcase/date-time"
    And I click the showcase button "btn-precision-optional-time"
    And I click the showcase sample preset "Date only"
    Then the time input should not be visible
    And the clock button should be visible
    When I click the clock button to add time
    Then the time input should be visible
