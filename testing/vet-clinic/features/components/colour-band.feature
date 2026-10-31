Feature: Colour Band Control Component
  As a field researcher or clinic manager
  I want a visual color band selector to tag and identify categories or physical markers
  So that color combinations are visually distinguishable in both edit and view modes

  @showcase @colour-band
  Scenario: Display color band in edit and view modes
    When I navigate to "/showcase/colour-band"
    Then the showcase header should display "ColourBandComponent"
    When I click the showcase button "btn-mode-view"
    Then the color band view should display the active color swatch
    When I click the showcase button "btn-mode-edit"
    Then the color band interactive input should be visible
