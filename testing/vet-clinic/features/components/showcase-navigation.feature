Feature: Component Showcase Navigation & Collapsible Categories
  As a developer inspecting components in the Component Showcase
  I want to access the showcase from the main Meta menu
  And I want the categories to be organized in collapsible accordions
  So that I can quickly navigate between component groups without visual clutter

  @showcase @navigation
  Scenario: Navigate to showcase from the Meta menu
    When I navigate to "/"
    When I click the menu dropdown "Meta"
    And I click the menu item "Showcase"
    Then the showcase header should display "TextFieldControlComponent"

  @showcase @accordion
  Scenario: Collapse and expand showcase categories
    When I navigate to "/showcase/text-field"
    Then the showcase category "Inputs & Primitives" should be "expanded"
    And the showcase category "Pickers & Calendars" should be "collapsed"
    And the showcase category "Selections & Badges" should be "collapsed"
    When I toggle the showcase category "Pickers & Calendars"
    Then the showcase category "Pickers & Calendars" should be "expanded"
    When I toggle the showcase category "Inputs & Primitives"
    Then the showcase category "Inputs & Primitives" should be "collapsed"

  @showcase @gherkin-updates
  Scenario: Gherkin tab updates reliably when switching components
    When I navigate to "/showcase/text-field"
    When I click the showcase tab "gherkin"
    Then the Gherkin feature specification should contain "Feature: Text Field Control Component"
    And the Gherkin feature specification should not contain "<!doctype html>"
    When I click the showcase nav item "text-area"
    Then the showcase header should display "TextAreaControlComponent"
    And the Gherkin feature specification should contain "Feature: Text Area Control Component"
    And the Gherkin feature specification should not contain "<!doctype html>"
    When I click the showcase nav item "url-field"
    Then the showcase header should display "UrlFieldControlComponent"
    And the Gherkin feature specification should contain "Feature: URL Field Control Component"
    And the Gherkin feature specification should not contain "<!doctype html>"
