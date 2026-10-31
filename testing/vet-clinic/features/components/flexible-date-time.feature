Feature: Flexible Date Time Control Component
  As a clinician recording observations with uncertain or approximate times
  I want a flexible datetime picker with fuzzy quick-select buttons like Day, Night, and Unknown
  So that timestamps can be recorded accurately or approximately without failing validation

  @showcase @flexible-date-time
  Scenario: Display flexible date time and toggle approximate time presets
    When I navigate to "/showcase/flexible-date-time"
    Then the showcase header should display "FlexibleDateTimeControlComponent"
    And the flexible date time picker inputs should be visible
    When I click the showcase button "btn-time-day"
    Then the form state inspector should show value "2026-05-18"
    When I click the showcase button "btn-mode-view"
    Then the flexible date time view should display formatted value
    When I click the showcase button "btn-mode-edit"
    Then the flexible date time picker inputs should be visible
