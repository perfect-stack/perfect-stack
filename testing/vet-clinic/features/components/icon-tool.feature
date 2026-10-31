Feature: Icon Tool Component
  As a user reviewing clinical dashboards and records
  I want prominent visual icons to identify categories and statuses at a glance
  So that visual cues reinforce important information

  @showcase @icon-tool
  Scenario: Display icon tool with Material Symbols
    When I navigate to "/showcase/icon-tool"
    Then the showcase header should display "IconToolComponent"
    And the icon tool should display icon "pets"
