Feature: Date Picker Control Component
  As a user recording calendar dates
  I want an intuitive date picker with calendar popup and localized formatting
  So that dates can be selected easily without formatting errors

  @showcase @date-picker
  Scenario: Display and inspect date picker in edit and view modes
    When I navigate to "/showcase/date-picker"
    Then the showcase header should display "DatePickerControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the date picker view should display formatted date "01-Nov-2026"
    When I click the showcase button "btn-mode-edit"
    Then the date picker input should contain "01-Nov-2026"
