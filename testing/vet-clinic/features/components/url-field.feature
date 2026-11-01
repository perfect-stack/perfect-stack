Feature: URL Field Control Component
  As a user managing web references and external links
  I want a dedicated URL field component that renders editable text in edit mode and clickable hyperlinks in view mode
  So that links can be directly navigated and checked

  @showcase @url-field
  Scenario: Edit URL and inspect clickable link in view mode
    When I navigate to "/showcase/url-field"
    Then the showcase header should display "UrlFieldControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the URL view link should be visible with text "https://perfect-stack.org"
    When I click the showcase button "btn-mode-edit"
    Then the URL input should be editable and contain "https://perfect-stack.org"
