Feature: Page Title Tool Component
  As a user navigating application pages
  I want contextual page titles that clearly reflect the active page and mode
  So that I understand what entity and action I am working on

  @showcase @page-title-tool
  Scenario: Display contextual page title in edit and view modes
    When I navigate to "/showcase/page-title-tool"
    Then the showcase header should display "PageTitleToolComponent"
    And the page title heading should display "Showcase Preview"
