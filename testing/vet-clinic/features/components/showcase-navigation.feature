Feature: Component Showcase Navigation & Collapsible Categories
  As a developer inspecting components in the Component Showcase
  I want to access the showcase from the main Meta menu
  And I want the categories to be organized in collapsible accordions
  So that I can quickly navigate between component groups without visual clutter

  @showcase @navigation
  Scenario: Navigate to showcase from the Meta menu
    When I navigate to "/"
    When I click the menu dropdown "Meta"
    And I click the menu item "Component Showcase"
    Then the showcase header should display "TextFieldControlComponent"

  @showcase @accordion
  Scenario: Collapse and expand showcase categories
    When I navigate to "/showcase/text-field"
    Then the showcase category "Inputs & Primitives" should be "expanded"
    And the showcase category "Pickers & Calendars" should be "expanded"
    When I toggle the showcase category "Inputs & Primitives"
    Then the showcase category "Inputs & Primitives" should be "collapsed"
    When I toggle the showcase category "Inputs & Primitives"
    Then the showcase category "Inputs & Primitives" should be "expanded"
