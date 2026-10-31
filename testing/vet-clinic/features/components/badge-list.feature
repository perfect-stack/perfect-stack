Feature: Badge List Component
  As a veterinary receptionist or nurse
  I want to view prominent badges summarizing pet status flags
  So that critical patient flags like vaccination or insurance status are immediately visible

  @showcase @badge-list
  Scenario: Display comma-separated status badges in the Component Showcase
    When I navigate to "/showcase/badge-list"
    Then the showcase header should display "BadgeListComponent"
    And the badge list should display badge "Vaccinated"
    And the badge list should display badge "Microchipped"
    And the badge list should display badge "Insured"
    And the badge list should have 3 badges
    When I click the showcase button "btn-mode-view"
    Then the badge list should display badge "Vaccinated"
